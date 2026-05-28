import { prisma } from "../lib/prisma.js";
import { findBestProduct, normalize } from "./aiService.js";

export function detectOrderIntent(text = "") {
  const t = normalize(text);

  return /(اريد|ابغى|اشتي|احجز|احجزه|اطلب|اطلبه|خلاص|تمام|خذ الطلب|جهز|جهزه|واحد|اثنين|2|1)/.test(
    t
  );
}

export function extractQuantity(text = "") {
  const t = normalize(text);

  const numberMatch = t.match(/\b(\d+)\b/);
  if (numberMatch) {
    return Math.max(1, Number(numberMatch[1]));
  }

  if (/(اثنين|حبتين|قطعتين)/.test(t)) return 2;
  if (/(ثلاثه|ثلاثة)/.test(t)) return 3;
  if (/(اربعه|اربعة)/.test(t)) return 4;
  if (/(خمسه|خمسة)/.test(t)) return 5;

  return 1;
}

export async function createOrderFromChat({
  userId,
  customerId,
  text,
  messages = [],
  products = [],
}) {
  if (!detectOrderIntent(text)) {
    return {
      created: false,
      reason: "NO_ORDER_INTENT",
    };
  }

  const recentText = [
    ...messages.slice(-8).map((m) => m.content),
    text,
  ].join(" ");

  const product = findBestProduct(recentText, products);

  if (!product) {
    return {
      created: false,
      reason: "NO_PRODUCT_MATCH",
    };
  }

  if (Number(product.stock) <= 0) {
    return {
      created: false,
      reason: "OUT_OF_STOCK",
      product,
    };
  }

  const quantity = Math.min(extractQuantity(text), Number(product.stock));

  const total = Number(product.price) * quantity;

  const order = await prisma.order.create({
    data: {
      userId,
      customerId,
      status: "PENDING",
      total,
      items: {
        create: [
          {
            productId: product.id,
            quantity,
            price: Number(product.price),
          },
        ],
      },
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  await prisma.product.update({
    where: {
      id: product.id,
    },
    data: {
      stock: Number(product.stock) - quantity,
    },
  });

  return {
    created: true,
    order,
    product,
    quantity,
    total,
  };
}

export function buildOrderConfirmation(result) {
  if (!result?.created) return null;

  return `تم تسجيل طلبك ✅

المنتج: ${result.product.name}
الكمية: ${result.quantity}
الإجمالي: ${result.total}

أرسل اسمك والمدينة لتأكيد التوصيل.`;
}