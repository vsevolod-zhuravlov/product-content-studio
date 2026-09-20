import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import {
  PrismaClient,
  ProductStatus,
  type Prisma,
} from "../src/generated/prisma/client";

type SeedProduct = {
  slug: string;
  name: string;
  specs: Array<{ label: string; value: string }>;
  description: string;
  seoTitle: string;
  seoDescription: string;
  status: ProductStatus;
};

const products: SeedProduct[] = [
  {
    slug: "aurora-x2",
    name: "Бездротові навушники Aurora X2",
    specs: [
      { label: "Вага", value: "250 г" },
      { label: "Час роботи", value: "до 40 год" },
      { label: "Bluetooth", value: "5.3" },
      { label: "Шумозаглушення", value: "ANC" },
    ],
    description:
      "40-мм динаміки з титановим покриттям відтворюють чисті високі частоти, виразну середину та глибокий контрольований бас. Aurora X2 зберігають деталізацію музики й голосу навіть на невисокій гучності, тож улюблені композиції звучать природно та об’ємно.\n\nМ’які амбушури з піни з ефектом пам’яті комфортно охоплюють вуха й не тиснуть під час тривалого прослуховування. Активне шумозаглушення ANC приглушує гул транспорту та офісний шум, допомагаючи зосередитися на звуці.",
    seoTitle: "Бездротові навушники Aurora X2 — купити з доставкою",
    seoDescription:
      "Бездротові навушники Aurora X2 з активним шумозаглушенням ANC, Bluetooth 5.3 та автономністю до 40 годин.",
    status: ProductStatus.PUBLISHED,
  },
  {
    slug: "lumen-5",
    name: "Робоча лампа Lumen 5",
    specs: [
      { label: "Потужність", value: "12 Вт" },
      { label: "Колірна температура", value: "2700–6500 K" },
      { label: "Живлення", value: "USB-C" },
      { label: "Яскравість", value: "5 рівнів" },
    ],
    description:
      "Світлодіоди без мерехтіння створюють рівномірне світло, яке не втомлює очі під час читання, роботи з документами чи навчання. П’ять рівнів яскравості та плавний вибір колірної температури від теплого до холодного допомагають налаштувати освітлення для будь-якого завдання.\n\nГнучка ніжка дає змогу точно спрямувати світловий потік і легко змінити висоту лампи. Компактна стійка основа займає мінімум місця на столі, а живлення через USB-C спрощує підключення вдома або в офісі.",
    seoTitle: "Настільна лампа Lumen 5 — світло для роботи",
    seoDescription:
      "Світлодіодна настільна лампа Lumen 5: 5 рівнів яскравості, регульована колірна температура та живлення через USB-C.",
    status: ProductStatus.PUBLISHED,
  },
  {
    slug: "keyra-75",
    name: "Механічна клавіатура Keyra 75",
    specs: [
      { label: "Розкладка", value: "75%" },
      { label: "Перемикачі", value: "лінійні, hot-swap" },
      { label: "З'єднання", value: "USB-C, Bluetooth, 2.4 ГГц" },
      { label: "Підсвітка", value: "RGB" },
    ],
    description:
      "Компактна розкладка 75% залишає всі потрібні клавіші, звільняє більше місця для миші та зручно поміщається в рюкзаку. Лінійні перемикачі з підтримкою hot-swap забезпечують плавне й тихе введення, а їх можна швидко замінити без паяння, щоб налаштувати відчуття клавіатури під себе.",
    seoTitle: "Механічна клавіатура Keyra 75 — компактна 75%",
    seoDescription:
      "Компактна механічна клавіатура Keyra 75 з лінійними перемикачами hot-swap, підсвіткою RGB і трьома режимами підключення.",
    status: ProductStatus.DRAFT,
  },
];

function requireAdminCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email) {
    throw new Error("ADMIN_EMAIL is required to seed the admin user.");
  }

  if (!password) {
    throw new Error("ADMIN_PASSWORD is required to seed the admin user.");
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters long.");
  }

  return { email, password };
}

function assertProductsAreValid(seedProducts: SeedProduct[]) {
  for (const product of seedProducts) {
    const fields = {
      slug: product.slug,
      name: product.name,
      description: product.description,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
    };

    for (const [field, value] of Object.entries(fields)) {
      if (!value.trim()) {
        throw new Error(`${product.slug}: ${field} must not be empty.`);
      }
    }

    if (product.description.length > 1000) {
      throw new Error(
        `${product.slug}: description must not exceed 1000 characters.`,
      );
    }

    if (product.seoTitle.length > 60) {
      throw new Error(
        `${product.slug}: seoTitle must not exceed 60 characters.`,
      );
    }

    if (product.seoDescription.length > 160) {
      throw new Error(
        `${product.slug}: seoDescription must not exceed 160 characters.`,
      );
    }

    if (
      product.specs.length === 0 ||
      product.specs.some(({ label, value }) => !label.trim() || !value.trim())
    ) {
      throw new Error(
        `${product.slug}: specs must contain non-empty labels and values.`,
      );
    }
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to seed the database.");
  }

  const { email, password } = requireAdminCredentials();
  assertProductsAreValid(products);

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await hash(password, 12);

    await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });

    for (const product of products) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: product as Prisma.ProductCreateInput,
      });
    }

    console.log("Seed complete: admin user and products are present.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Database seed failed.",
  );
  process.exitCode = 1;
});
