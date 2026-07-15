const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // Route Trie library
    const trie_mod = b.addSharedLibrary(.{
        .name = "buntok_trie",
        .root_source_file = b.path("native/trie.zig"),
        .target = target,
        .optimize = optimize,
    });
    trie_mod.linkLibC();
    b.installArtifact(trie_mod);

    // JSON Serializer library
    const json_mod = b.addSharedLibrary(.{
        .name = "buntok_json",
        .root_source_file = b.path("native/json.zig"),
        .target = target,
        .optimize = optimize,
    });
    json_mod.linkLibC();
    b.installArtifact(json_mod);

    // Query Parser library
    const parse_mod = b.addSharedLibrary(.{
        .name = "buntok_parse",
        .root_source_file = b.path("native/parse.zig"),
        .target = target,
        .optimize = optimize,
    });
    parse_mod.linkLibC();
    b.installArtifact(parse_mod);

    // Build step
    const build_step = b.step("native", "Build all native libraries");
    build_step.dependOn(&trie_mod.step);
    build_step.dependOn(&json_mod.step);
    build_step.dependOn(&parse_mod.step);
}
