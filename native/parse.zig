const std = @import("std");
const mem = std.mem;
const Allocator = mem.Allocator;

// ─── Query String Parser ─────────────────────────────────────────────────────

pub const QueryParam = struct {
    key: []const u8,
    value: []const u8,
};

pub const QueryResult = struct {
    params: []QueryParam,
    count: u32,
};

// ─── Cookie Parser ───────────────────────────────────────────────────────────

pub const Cookie = struct {
    name: []const u8,
    value: []const u8,
};

pub const CookieResult = struct {
    cookies: []Cookie,
    count: u32,
};

// ─── URL Decoder ─────────────────────────────────────────────────────────────

pub fn urlDecode(input: []const u8, output: []u8) usize {
    var out_idx: usize = 0;
    var in_idx: usize = 0;

    while (in_idx < input.len) {
        if (input[in_idx] == '%' and in_idx + 2 < input.len) {
            const high = hexToDigit(input[in_idx + 1]);
            const low = hexToDigit(input[in_idx + 2]);
            if (high != 0xFF and low != 0xFF) {
                output[out_idx] = (high << 4) | low;
                out_idx += 1;
                in_idx += 3;
                continue;
            }
        } else if (input[in_idx] == '+') {
            output[out_idx] = ' ';
            out_idx += 1;
            in_idx += 1;
            continue;
        }

        output[out_idx] = input[in_idx];
        out_idx += 1;
        in_idx += 1;
    }

    return out_idx;
}

fn hexToDigit(c: u8) u8 {
    return switch (c) {
        '0'...'9' => c - '0',
        'a'...'f' => c - 'a' + 10,
        'A'...'F' => c - 'A' + 10,
        else => 0xFF,
    };
}

// ─── Query String Parser ─────────────────────────────────────────────────────

pub fn parseQueryString(
    allocator: Allocator,
    query: []const u8,
) QueryResult {
    if (query.len == 0) {
        return .{ .params = &[_]QueryParam{}, .count = 0 };
    }

    var params = std.ArrayList(QueryParam).init(allocator);
    var iter = mem.splitScalar(u8, query, '&');

    while (iter.next()) |pair| {
        if (pair.len == 0) continue;

        const key_end = mem.indexOf(u8, pair, "=");
        var key: []const u8 = undefined;
        var value: []const u8 = undefined;

        if (key_end) |eq_pos| {
            key = pair[0..eq_pos];
            value = pair[eq_pos + 1 ..];
        } else {
            key = pair;
            value = "";
        }

        // URL decode key and value
        var decoded_key_buf: [1024]u8 = undefined;
        var decoded_value_buf: [4096]u8 = undefined;

        const key_len = urlDecode(key, &decoded_key_buf);
        const value_len = urlDecode(value, &decoded_value_buf);

        const decoded_key = allocator.dupe(u8, decoded_key_buf[0..key_len]) catch continue;
        const decoded_value = allocator.dupe(u8, decoded_value_buf[0..value_len]) catch continue;

        params.append(.{ .key = decoded_key, .value = decoded_value }) catch continue;
    }

    const result = params.toOwnedSlice() catch return .{ .params = &[_]QueryParam{}, .count = 0 };
    return .{ .params = result, .count = @intCast(result.len) };
}

// ─── Cookie Parser ───────────────────────────────────────────────────────────

pub fn parseCookies(
    allocator: Allocator,
    cookie_header: []const u8,
) CookieResult {
    if (cookie_header.len == 0) {
        return .{ .cookies = &[_]Cookie{}, .count = 0 };
    }

    var cookies = std.ArrayList(Cookie).init(allocator);
    var iter = mem.splitScalar(u8, cookie_header, ';');

    while (iter.next()) |pair| {
        // Skip leading whitespace
        var start: usize = 0;
        while (start < pair.len and pair[start] == ' ') {
            start += 1;
        }

        if (start >= pair.len) continue;

        const trimmed = pair[start..];
        const name_end = mem.indexOf(u8, trimmed, "=");
        var name: []const u8 = undefined;
        var value: []const u8 = undefined;

        if (name_end) |eq_pos| {
            name = trimmed[0..eq_pos];
            value = trimmed[eq_pos + 1 ..];
        } else {
            name = trimmed;
            value = "";
        }

        const duped_name = allocator.dupe(u8, name) catch continue;
        const duped_value = allocator.dupe(u8, value) catch continue;

        cookies.append(.{ .name = duped_name, .value = duped_value }) catch continue;
    }

    const result = cookies.toOwnedSlice() catch return .{ .cookies = &[_]Cookie{}, .count = 0 };
    return .{ .cookies = result, .count = @intCast(result.len) };
}

// ─── C ABI Exports ───────────────────────────────────────────────────────────

var global_parse_gpa: std.heap.GeneralPurposeAllocator(.{}) = undefined;
var global_parse_allocator: ?Allocator = null;

export fn parse_init() void {
    global_parse_gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = global_parse_gpa.allocator();
    global_parse_allocator = allocator;
}

export fn parse_deinit() void {
    global_parse_allocator = null;
}

export fn parse_query(
    query_ptr: [*]const u8,
    query_len: u32,
    result: *QueryResult,
) void {
    if (global_parse_allocator) |allocator| {
        const query = query_ptr[0..query_len];
        result.* = parseQueryString(allocator, query);
    }
}

export fn parse_cookies(
    cookie_ptr: [*]const u8,
    cookie_len: u32,
    result: *CookieResult,
) void {
    if (global_parse_allocator) |allocator| {
        const cookie_header = cookie_ptr[0..cookie_len];
        result.* = parseCookies(allocator, cookie_header);
    }
}

export fn parse_free_query_params(params: [*]QueryParam, count: u32) void {
    // In production, use arena allocator for automatic cleanup
    _ = params;
    _ = count;
}

export fn parse_free_cookies(cookies: [*]Cookie, count: u32) void {
    _ = cookies;
    _ = count;
}
