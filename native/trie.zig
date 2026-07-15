const std = @import("std");
const mem = std.mem;
const Allocator = mem.Allocator;

pub const NodeType = enum(u8) {
    static = 0,
    param = 1,
    catchall = 2,
};

const TrieNode = struct {
    children: std.StringHashMap(*TrieNode),
    param_child: ?*TrieNode,
    catchall_child: ?*TrieNode,
    handler_id: i32,
    param_name: ?[]const u8,
    node_type: NodeType,

    fn init(allocator: Allocator) TrieNode {
        return .{
            .children = std.StringHashMap(*TrieNode).init(allocator),
            .param_child = null,
            .catchall_child = null,
            .handler_id = -1,
            .param_name = null,
            .node_type = .static,
        };
    }

    fn deinit(self: *TrieNode, allocator: Allocator) void {
        var it = self.children.iterator();
        while (it.next()) |entry| {
            entry.value_ptr.*.deinit(allocator);
            allocator.destroy(entry.value_ptr.*);
        }
        self.children.deinit();
    }
};

pub const Trie = struct {
    allocator: Allocator,
    root: *TrieNode,
    node_count: u32,

    pub fn init(allocator: Allocator) Trie {
        const root = allocator.create(TrieNode) catch unreachable;
        root.* = TrieNode.init(allocator);
        return .{
            .allocator = allocator,
            .root = root,
            .node_count = 0,
        };
    }

    pub fn deinit(self: *Trie) void {
        self.root.deinit(self.allocator);
        self.allocator.destroy(self.root);
    }

    pub fn insert(self: *Trie, path: []const u8, handler_id: i32) void {
        var current = self.root;
        var start: usize = if (path.len > 0 and path[0] == '/') 1 else 0;

        while (start < path.len) {
            var end = start;
            while (end < path.len and path[end] != '/') {
                end += 1;
            }

            if (end > start) {
                const segment = path[start..end];
                var node_type: NodeType = .static;
                var clean_segment = segment;
                var param_name: ?[]const u8 = null;

                if (segment[0] == ':') {
                    node_type = .param;
                    param_name = segment[1..];
                    clean_segment = ":";
                } else if (segment[0] == '*') {
                    node_type = .catchall;
                    param_name = segment[1..];
                    clean_segment = "*";
                }

                var next_node: ?*TrieNode = switch (node_type) {
                    .static => current.children.get(clean_segment),
                    .param => current.param_child,
                    .catchall => current.catchall_child,
                };

                if (next_node == null) {
                    const new_node = self.allocator.create(TrieNode) catch unreachable;
                    new_node.* = TrieNode.init(self.allocator);
                    new_node.node_type = node_type;
                    new_node.param_name = param_name;

                    switch (node_type) {
                        .static => {
                            current.children.put(clean_segment, new_node) catch unreachable;
                        },
                        .param => current.param_child = new_node,
                        .catchall => current.catchall_child = new_node,
                    }
                    next_node = new_node;
                    self.node_count += 1;
                }

                current = next_node.?;
                if (node_type == .catchall) break;
            }
            start = end + 1;
        }

        current.handler_id = handler_id;
    }

    pub fn find(self: *Trie, path: []const u8) i32 {
        var current = self.root;
        var start: usize = if (path.len > 0 and path[0] == '/') 1 else 0;

        while (start < path.len) {
            var end = start;
            while (end < path.len and path[end] != '/') {
                end += 1;
            }

            if (end > start) {
                const segment = path[start..end];
                var next_node: ?*TrieNode = current.children.get(segment);

                if (next_node == null) {
                    if (current.param_child) |param_node| {
                        next_node = param_node;
                    } else if (current.catchall_child) |catchall_node| {
                        current = catchall_node;
                        break;
                    } else {
                        return -1;
                    }
                }

                current = next_node.?;
            }
            start = end + 1;
        }

        return current.handler_id;
    }
};

// ─── C ABI Exports ───────────────────────────────────────────────────────────

var global_trie: ?*Trie = null;
var global_gpa: std.heap.GeneralPurposeAllocator(.{}) = std.heap.GeneralPurposeAllocator(.{}){};

export fn trie_init() void {
    const allocator = global_gpa.allocator();
    const trie_ptr = allocator.create(Trie) catch unreachable;
    trie_ptr.* = Trie.init(allocator);
    global_trie = trie_ptr;
}

export fn trie_deinit() void {
    if (global_trie) |trie| {
        trie.deinit();
        global_gpa.allocator().destroy(trie);
    }
    global_trie = null;
}

export fn trie_insert(path_ptr: [*]const u8, path_len: u32, handler_id: i32) void {
    if (global_trie) |trie| {
        trie.insert(path_ptr[0..path_len], handler_id);
    }
}

export fn trie_find(path_ptr: [*]const u8, path_len: u32) i32 {
    if (global_trie) |trie| {
        return trie.find(path_ptr[0..path_len]);
    }
    return -1;
}

export fn trie_node_count() u32 {
    if (global_trie) |trie| {
        return trie.node_count;
    }
    return 0;
}
