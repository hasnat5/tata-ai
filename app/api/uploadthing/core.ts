import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const auth = (req: Request) => ({ id: "demo-user" }); // Demo auth function

export const ourFileRouter = {
    // Character reference images (up to 5 images, 4MB each)
    characterReferenceUploader: f({
        image: {
            maxFileSize: "4MB",
            maxFileCount: 5,
        },
    })
        .middleware(async ({ req }) => {
            const user = await auth(req);
            if (!user) throw new UploadThingError("Unauthorized");
            return { userId: user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Character reference uploaded for:", metadata.userId);
            console.log("File URL:", file.ufsUrl);
            return { url: file.ufsUrl };
        }),

    // Voice sample for cloning (audio file, up to 10MB)
    voiceSampleUploader: f({
        audio: {
            maxFileSize: "16MB",
            maxFileCount: 1,
        },
    })
        .middleware(async ({ req }) => {
            const user = await auth(req);
            if (!user) throw new UploadThingError("Unauthorized");
            return { userId: user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Voice sample uploaded for:", metadata.userId);
            console.log("File URL:", file.ufsUrl);
            return { url: file.ufsUrl };
        }),

    // Style reference images (up to 10 images for aesthetic)
    styleReferenceUploader: f({
        image: {
            maxFileSize: "4MB",
            maxFileCount: 10,
        },
    })
        .middleware(async ({ req }) => {
            const user = await auth(req);
            if (!user) throw new UploadThingError("Unauthorized");
            return { userId: user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Style reference uploaded for:", metadata.userId);
            console.log("File URL:", file.ufsUrl);
            return { url: file.ufsUrl };
        }),

    // Brand logo (single image)
    brandLogoUploader: f({
        image: {
            maxFileSize: "4MB",
            maxFileCount: 1,
        },
    })
        .middleware(async ({ req }) => {
            const user = await auth(req);
            if (!user) throw new UploadThingError("Unauthorized");
            return { userId: user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Brand logo uploaded for:", metadata.userId);
            console.log("File URL:", file.ufsUrl);
            return { url: file.ufsUrl };
        }),

    // Project documents (PDFs, text files for briefs)
    documentUploader: f({
        pdf: {
            maxFileSize: "16MB",
            maxFileCount: 5,
        },
        text: {
            maxFileSize: "4MB",
            maxFileCount: 5,
        },
    })
        .middleware(async ({ req }) => {
            const user = await auth(req);
            if (!user) throw new UploadThingError("Unauthorized");
            return { userId: user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Document uploaded for:", metadata.userId);
            console.log("File URL:", file.ufsUrl);
            return { url: file.ufsUrl };
        }),

    // General image uploader for chat attachments
    chatImageUploader: f({
        image: {
            maxFileSize: "4MB",
            maxFileCount: 10,
        },
    })
        .middleware(async ({ req }) => {
            const user = await auth(req);
            if (!user) throw new UploadThingError("Unauthorized");
            return { userId: user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Chat image uploaded for:", metadata.userId);
            console.log("File URL:", file.ufsUrl);
            return { url: file.ufsUrl };
        }),

    // Combined uploader for chat attachments (images, audio, documents)
    chatAttachmentUploader: f({
        image: {
            maxFileSize: "4MB",
            maxFileCount: 10,
        },
        audio: {
            maxFileSize: "16MB",
            maxFileCount: 5,
        },
        pdf: {
            maxFileSize: "16MB",
            maxFileCount: 5,
        },
    })
        .middleware(async ({ req }) => {
            const user = await auth(req);
            if (!user) throw new UploadThingError("Unauthorized");
            return { userId: user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Chat attachment uploaded for:", metadata.userId);
            console.log("File URL:", file.ufsUrl, "Type:", file.type);
            return { url: file.ufsUrl, type: file.type, name: file.name };
        }),

    // Syllabus PDF uploader for planning feature (multiple PDFs)
    syllabusPdfUploader: f({
        pdf: {
            maxFileSize: "32MB",
            maxFileCount: 10,
        },
    })
        .middleware(async ({ req }) => {
            const user = await auth(req);
            if (!user) throw new UploadThingError("Unauthorized");
            return { userId: user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Syllabus PDF uploaded for:", metadata.userId);
            console.log("File URL:", file.ufsUrl);
            return { url: file.ufsUrl, name: file.name };
        }),

    // Generated video uploader (for Veo 3.1 scene videos)
    generatedVideoUploader: f({
        video: {
            maxFileSize: "256MB",
            maxFileCount: 1,
        },
    })
        .middleware(async ({ req }) => {
            const user = await auth(req);
            if (!user) throw new UploadThingError("Unauthorized");
            return { userId: user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Generated video uploaded for:", metadata.userId);
            console.log("File URL:", file.ufsUrl);
            return { url: file.ufsUrl, name: file.name };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
