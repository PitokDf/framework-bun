import { Heading } from "@/components/ui/Heading";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Callout } from "@/components/ui/Callout";

export const metadata = {
  title: "File Upload",
  description: "Handle multipart file uploads with custom storage drivers and validation.",
};


export default function UploadPage() {
  return (
    <div>
      <Heading
        level={1}
        className="text-4xl font-bold mt-8 mb-4 text-text-primary"
      >
        File Upload
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Parse multipart/form-data requests for file uploads. Supports storage
        drivers, field validation, custom filenames, and middleware mode.
      </p>

      {/* ──────────────── STORAGE DRIVERS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Storage Drivers
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Driver
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                LocalDiskStorage
              </td>
              <td className="px-4 py-2">
                Saves files to disk. Auto-creates directories.
              </td>
            </tr>
            <tr className="border-b border-border-primary">
              <td className="px-4 py-2 font-mono text-accent">
                MemoryStorage
              </td>
              <td className="px-4 py-2">
                Stores files in memory as ArrayBuffer. Good for processing.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Heading
        level={3}
        className="text-xl font-semibold mt-6 mb-2 text-text-primary"
      >
        Custom Storage Driver
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Implement the <code>StorageDriver</code> interface to use S3, GCS, or
        any other storage:
      </p>
      <CodeBlock
        code={`import type { StorageDriver, UploadedFile } from "@buntok/core";

class S3Storage implements StorageDriver {
  constructor(private bucket: string, private region: string) {}

  async handleFile(file: File, name: string, ext: string): Promise<UploadedFile> {
    const key = \`uploads/\${name}\${ext}\`;
    await s3.putObject({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: file.type,
    });

    return {
      originalName: file.name,
      name,
      ext,
      size: file.size,
      type: file.type,
      path: key, // S3 key as "path"
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    await s3.deleteObject({ Bucket: this.bucket, Key: key });
    return true;
  }
}

// Usage
const result = await parseUploads(ctx, {
  storage: new S3Storage("my-bucket", "us-east-1"),
});`}
      />

      <Callout type="info">
        <code>StorageDriver</code> requires two methods:{" "}
        <code>handleFile(file, name, ext)</code> and optional{" "}
        <code>deleteFile(path)</code>.
      </Callout>

      {/* ──────────────── BASIC USAGE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Basic Usage
      </Heading>
      <CodeBlock
        code={`import { parseUploads, LocalDiskStorage } from "@buntok/core";

app.post("/upload", async (ctx) => {
  const result = await parseUploads(ctx, {
    storage: new LocalDiskStorage("./uploads"),
  });

  return ctx.json({ files: result.files.map(f => f.name) });
});`}
      />

      {/* ──────────────── UPLOAD OPTIONS ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Options
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Option
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "storage",
                "StorageDriver",
                "Required. LocalDiskStorage or MemoryStorage",
              ],
              [
                "maxFileSize",
                "number",
                "Global max file size in bytes",
              ],
              [
                "allowedMimeTypes",
                "string[]",
                "Global allowed MIME types",
              ],
              [
                "filename",
                "(originalName, file) => { name, ext }",
                "Global filename generator",
              ],
              [
                "fields",
                "Record<string, UploadFieldConfig>",
                "Per-field config (required, size, types, filename)",
              ],
            ].map(([opt, type, desc]) => (
              <tr
                key={opt}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{opt}</td>
                <td className="px-4 py-2 font-mono text-text-secondary text-xs">
                  {type}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── FIELD CONFIG ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        UploadFieldConfig
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Field
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["required", "boolean", "Reject if field is missing (default: false)"],
              [
                "maxFileSize",
                "number",
                "Max size in bytes (overrides global)",
              ],
              [
                "allowedMimeTypes",
                "string[]",
                "Allowed types (overrides global)",
              ],
              [
                "filename",
                "(originalName, file) => { name, ext }",
                "Filename generator (overrides global)",
              ],
            ].map(([field, type, desc]) => (
              <tr
                key={field}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{field}</td>
                <td className="px-4 py-2 font-mono text-text-secondary text-xs">
                  {type}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── VALIDATION ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Validation
      </Heading>
      <CodeBlock
        code={`import { parseUploads, LocalDiskStorage } from "@buntok/core";

const result = await parseUploads(ctx, {
  storage: new LocalDiskStorage("./uploads"),
  maxFileSize: 5 * 1024 * 1024, // 5MB global
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  fields: {
    avatar: {
      required: true,
      maxFileSize: 2 * 1024 * 1024, // 2MB (overrides global)
      allowedMimeTypes: ["image/jpeg", "image/png"],
    },
    document: {
      required: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    },
  },
});`}
      />

      <Callout type="warning">
        Throws <code>BadRequestError</code> if validation fails (size, MIME type,
        or required fields missing).
      </Callout>

      {/* ──────────────── UPLOADED FILE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        UploadedFile
      </Heading>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm text-text-secondary border border-border-primary rounded-lg overflow-hidden">
          <thead className="bg-bg-tertiary border-b border-border-primary">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Property
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Type
              </th>
              <th className="px-4 py-2 text-left font-semibold text-text-primary">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["originalName", "string", "Original filename from user"],
              [
                "name",
                "string",
                "Generated name (with UUID)",
              ],
              ["ext", "string", "File extension with dot (e.g. .png)"],
              ["size", "number", "File size in bytes"],
              ["type", "string", "MIME type"],
              [
                "buffer",
                "ArrayBuffer",
                "File data (MemoryStorage only)",
              ],
              [
                "path",
                "string",
                "Absolute path on disk (LocalDiskStorage only)",
              ],
            ].map(([prop, type, desc]) => (
              <tr
                key={prop}
                className="border-b border-border-primary/50 hover:bg-bg-tertiary/50 transition-colors"
              >
                <td className="px-4 py-2 font-mono text-accent">{prop}</td>
                <td className="px-4 py-2 font-mono text-text-secondary">
                  {type}
                </td>
                <td className="px-4 py-2">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────── RESULT ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Result
      </Heading>
      <CodeBlock
        code={`const result = await parseUploads(ctx, options);

result.fields.name       // string (text field)
result.fields.avatar     // UploadedFile (file field)
result.fields.gallery    // UploadedFile[] (multiple files with same key)
result.files             // UploadedFile[] (all files, flattened)`}
      />

      {/* ──────────────── UPLOADER MIDDLEWARE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Uploader Middleware
      </Heading>
      <p className="my-3 text-text-secondary leading-relaxed">
        Use <code>uploader()</code> as middleware to auto-parse uploads and store
        results in <code>ctx.store</code>:
      </p>
      <CodeBlock
        code={`import { uploader, LocalDiskStorage } from "@buntok/core";

const upload = uploader({
  storage: new LocalDiskStorage("./uploads"),
  maxFileSize: 5 * 1024 * 1024,
  fields: {
    avatar: { required: true },
  },
});

// As route middleware
app.post("/profile", upload, async (ctx) => {
  const files = ctx.store.files;  // UploadedFile[]
  const fields = ctx.store.fields;
  return ctx.json({ uploaded: files.length });
});

// As global middleware
app.use(uploader({
  storage: new LocalDiskStorage("./uploads"),
}));

// As group middleware
const api = app.group("/api");
api.use(uploader({ storage: new LocalDiskStorage("./uploads") }));`}
      />

      {/* ──────────────── CUSTOM FILENAME ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Custom Filename
      </Heading>
      <CodeBlock
        code={`// Global custom filename
const result = await parseUploads(ctx, {
  storage: new LocalDiskStorage("./uploads"),
  filename: (originalName, file) => {
    const ext = originalName.split(".").pop();
    return { name: \`upload-\${Date.now()}\`, ext: \`.\${ext}\` };
  },
});

// Per-field custom filename (overrides global)
const result = await parseUploads(ctx, {
  storage: new LocalDiskStorage("./uploads"),
  fields: {
    avatar: {
      filename: (originalName, file) => {
        return { name: \`avatar-\${Date.now()}\`, ext: ".jpg" };
      },
    },
  },
});`}
      />

      {/* ──────────────── DELETE FILE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Delete Uploaded File
      </Heading>
      <CodeBlock
        code={`import { deleteUploadedFile, LocalDiskStorage } from "@buntok/core";

const storage = new LocalDiskStorage("./uploads");
const result = await parseUploads(ctx, { storage });

// Delete a specific file
const file = result.fields.avatar;
if (file) {
  await deleteUploadedFile(storage, file);
}`}
      />

      {/* ──────────────── FULL EXAMPLE ──────────────── */}
      <Heading
        level={2}
        className="text-2xl font-semibold mt-8 mb-3 text-text-primary border-b border-border-primary pb-2"
      >
        Full Example
      </Heading>
      <CodeBlock
        code={`import { App, parseUploads, LocalDiskStorage } from "@buntok/core";

const app = new App();

const storage = new LocalDiskStorage("./uploads");

// Single file upload
app.post("/avatar", async (ctx) => {
  const result = await parseUploads(ctx, {
    storage,
    maxFileSize: 2 * 1024 * 1024, // 2MB
    fields: {
      avatar: {
        required: true,
        allowedMimeTypes: ["image/jpeg", "image/png"],
      },
    },
  });

  const avatar = result.fields.avatar;
  return ctx.json({ path: avatar.path, name: avatar.name });
});

// Multiple file upload
app.post("/gallery", async (ctx) => {
  const result = await parseUploads(ctx, {
    storage,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    fields: {
      images: {
        required: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      },
    },
  });

  const images = result.fields.images; // UploadedFile[]
  return ctx.json({ count: images.length });
});

// Text fields + file
app.post("/post", async (ctx) => {
  const result = await parseUploads(ctx, {
    storage,
    fields: {
      cover: { required: true },
    },
  });

  const title = result.fields.title;  // string (text field)
  const cover = result.fields.cover;  // UploadedFile (file field)

  const post = await db.post.create({
    data: { title, coverPath: cover.path },
  });

  return ctx.json({ id: post.id });
});

app.listen(1212);`}
      />
    </div>
  );
}
