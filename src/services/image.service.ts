import { prisma } from "@/lib/prisma";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

export const imageService = {
  async upload(productId: string, file: Buffer, makeMain = false): Promise<{
    id: string;
    url: string;
    publicId: string;
    esPrincipal: boolean;
  }> {
    const { url, publicId } = await uploadImage(file);

    if (makeMain) {
      await prisma.image.updateMany({
        where: { productId },
        data: { esPrincipal: false },
      });
    }

    const maxOrden = await prisma.image.aggregate({
      _max: { orden: true },
      where: { productId },
    });

    const image = await prisma.image.create({
      data: {
        productId,
        url,
        publicId,
        esPrincipal: makeMain,
        orden: (maxOrden._max.orden ?? -1) + 1,
      },
    });

    return image;
  },

  async setMain(imageId: string, productId: string): Promise<void> {
    await prisma.$transaction([
      prisma.image.updateMany({ where: { productId }, data: { esPrincipal: false } }),
      prisma.image.update({ where: { id: imageId }, data: { esPrincipal: true } }),
    ]);
  },

  async delete(imageId: string): Promise<void> {
    const image = await prisma.image.findUniqueOrThrow({ where: { id: imageId } });
    await deleteImage(image.publicId);
    await prisma.image.delete({ where: { id: imageId } });

    // If deleted image was main, promote next
    if (image.esPrincipal) {
      const next = await prisma.image.findFirst({
        where: { productId: image.productId },
        orderBy: { orden: "asc" },
      });
      if (next) {
        await prisma.image.update({ where: { id: next.id }, data: { esPrincipal: true } });
      }
    }
  },
};
