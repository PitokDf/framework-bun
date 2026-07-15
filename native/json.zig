const std = @import("std");
const mem = std.mem;
const Allocator = mem.Allocator;

// ─── JSON Serializer ─────────────────────────────────────────────────────────

pub const JsonWriter = struct {
    allocator: Allocator,
    buffer: std.ArrayList(u8),

    pub fn init(allocator: Allocator) JsonWriter {
        return .{
            .allocator = allocator,
            .buffer = std.ArrayList(u8).init(allocator),
        };
    }

    pub fn deinit(self: *JsonWriter) void {
        self.buffer.deinit();
    }

    pub fn reset(self: *JsonWriter) void {
        self.buffer.clearRetainingCapacity();
    }

    pub fn serialize(self: *JsonWriter, value: anytype) ![]u8 {
        try self.writeValue(value);
        return try self.buffer.toOwnedSlice();
    }

    fn writeValue(self: *JsonWriter, value: anytype) !void {
        const T = @TypeOf(value);
        const info = @typeInfo(T);

        switch (info) {
            .Pointer => |ptr_info| {
                if (ptr_info.size == .Slice) {
                    if (ptr_info.child == u8) {
                        // String
                        try self.writeQuoted(value);
                    } else {
                        // Array/slice
                        try self.buffer.append('[');
                        for (value, 0..) |item, i| {
                            if (i > 0) try self.buffer.append(',');
                            try self.writeValue(item);
                        }
                        try self.buffer.append(']');
                    }
                } else {
                    // Single pointer
                    try self.writeValue(value.*);
                }
            },
            .Struct => {
                try self.writeStruct(value);
            },
            .Optional => {
                if (value) |v| {
                    try self.writeValue(v);
                } else {
                    try self.buffer.appendSlice("null");
                }
            },
            .Bool => {
                if (value) {
                    try self.buffer.appendSlice("true");
                } else {
                    try self.buffer.appendSlice("false");
                }
            },
            .Int, .ComptimeInt => {
                try self.writeInt(value);
            },
            .Float, .ComptimeFloat => {
                try self.writeFloat(value);
            },
            .Null => {
                try self.buffer.appendSlice("null");
            },
            .Array => {
                try self.buffer.append('[');
                for (value, 0..) |item, i| {
                    if (i > 0) try self.buffer.append(',');
                    try self.writeValue(item);
                }
                try self.buffer.append(']');
            },
            .Enum => {
                try self.writeInt(@intFromEnum(value));
            },
            .Union => {
                // Try to serialize as the active variant
                const active = std.meta.activeTag(value);
                try self.writeValue(@field(value, @tagName(active)));
            },
            else => {
                // Unsupported type, serialize as null
                try self.buffer.appendSlice("null");
            },
        }
    }

    fn writeStruct(self: *JsonWriter, value: anytype) !void {
        try self.buffer.append('{');
        var first = true;
        inline for (std.meta.fields(@TypeOf(value))) |field| {
            const field_value = @field(value, field.name);
            // Skip optional fields that are null
            if (@typeInfo(field.field_type) == .Optional) {
                if (field_value == null) continue;
            }
            if (!first) try self.buffer.append(',');
            first = false;
            try self.writeQuoted(field.name);
            try self.buffer.append(':');
            try self.writeValue(field_value);
        }
        try self.buffer.append('}');
    }

    fn writeQuoted(self: *JsonWriter, str: []const u8) !void {
        try self.buffer.append('"');
        for (str) |c| {
            switch (c) {
                '"' => try self.buffer.appendSlice("\\\""),
                '\\' => try self.buffer.appendSlice("\\\\"),
                '\n' => try self.buffer.appendSlice("\\n"),
                '\r' => try self.buffer.appendSlice("\\r"),
                '\t' => try self.buffer.appendSlice("\\t"),
                0x20...0x21, 0x23...0x5B, 0x5D...0x7E => try self.buffer.append(c),
                else => {
                    const hex = [2]u8{ "0123456789abcdef"[c >> 4], "0123456789abcdef"[c & 0x0F] };
                    try self.buffer.appendSlice("\\u00");
                    try self.buffer.appendSlice(&hex);
                },
            }
        }
        try self.buffer.append('"');
    }

    fn writeInt(self: *JsonWriter, value: anytype) !void {
        const str = try std.fmt.allocPrint(self.allocator, "{}", .{value});
        defer self.allocator.free(str);
        try self.buffer.appendSlice(str);
    }

    fn writeFloat(self: *JsonWriter, value: anytype) !void {
        const str = try std.fmt.allocPrint(self.allocator, "{d}", .{value});
        defer self.allocator.free(str);
        try self.buffer.appendSlice(str);
    }
};

// ─── C ABI Exports ───────────────────────────────────────────────────────────

var global_json_gpa: std.heap.GeneralPurposeAllocator(.{}) = undefined;
var global_json_allocator: ?Allocator = null;
var global_json_writer: ?*JsonWriter = null;

export fn json_init() void {
    global_json_gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = global_json_gpa.allocator();
    const writer = allocator.create(JsonWriter) catch unreachable;
    writer.* = JsonWriter.init(allocator);
    global_json_allocator = allocator;
    global_json_writer = writer;
}

export fn json_deinit() void {
    if (global_json_writer) |writer| {
        writer.deinit();
        if (global_json_allocator) |alloc| {
            alloc.destroy(writer);
        }
    }
    global_json_writer = null;
    global_json_allocator = null;
}

// For FFI: serialize a string to JSON (escaping special chars)
export fn json_escape_string(
    input_ptr: [*]const u8,
    input_len: u32,
    output_ptr: *[*]u8,
    output_len: *u32,
) i32 {
    if (global_json_writer) |writer| {
        writer.reset();
        const input = input_ptr[0..input_len];
        writer.writeQuoted(input) catch return -1;
        const result = writer.buffer.toOwnedSlice() catch return -1;
        output_ptr.* = result.ptr;
        output_len.* = @intCast(result.len);
        return 0;
    }
    return -1;
}

// For FFI: get the raw buffer pointer (for reuse)
export fn json_get_buffer() ?[*]u8 {
    if (global_json_writer) |writer| {
        return writer.buffer.items.ptr;
    }
    return null;
}

export fn json_get_buffer_len() u32 {
    if (global_json_writer) |writer| {
        return @intCast(writer.buffer.items.len);
    }
    return 0;
}
