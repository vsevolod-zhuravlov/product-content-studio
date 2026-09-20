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
    slug: "nimbus-s3",
    name: "Смартгодинник Nimbus S3",
    specs: [
      { label: "Екран", value: "1.43\" AMOLED" },
      { label: "Автономність", value: "до 10 днів" },
      { label: "Водозахист", value: "5 ATM" },
      { label: "Датчики", value: "пульс, SpO2, GPS" },
    ],
    description:
      "Яскравий AMOLED-екран діагоналлю 1.43 дюйма чітко показує час, сповіщення та показники тренування навіть під прямим сонцем. Вбудований GPS фіксує маршрут без телефону, а датчики пульсу та насичення крові киснем допомагають стежити за самопочуттям протягом дня.\n\nКорпус із захистом 5 ATM витримує дощ і плавання в басейні. Заряду вистачає до десяти днів у змішаному режимі, тож годинник рідко потребує розетки.",
    seoTitle: "Смартгодинник Nimbus S3 — пульс, GPS, 10 днів",
    seoDescription:
      "Смартгодинник Nimbus S3 з AMOLED-екраном, GPS, датчиками пульсу та кисню, водозахистом 5 ATM і автономністю до 10 днів.",
    status: ProductStatus.PUBLISHED,
  },
  {
    slug: "volta-20",
    name: "Павербанк Volta 20",
    specs: [
      { label: "Ємність", value: "20 000 мА·год" },
      { label: "Порти", value: "USB-C, USB-A" },
      { label: "Потужність", value: "65 Вт" },
      { label: "Вага", value: "340 г" },
    ],
    description:
      "Місткість 20 000 мА·год дозволяє кілька разів зарядити ноутбук, планшет і смартфон у дорозі. Порт USB-C підтримує двосторонню зарядку потужністю до 65 Вт, а додатковий USB-A живить другий пристрій одночасно.\n\nКомпактний корпус важить 340 г і зручно лягає в рюкзак. Індикатор заряду показує залишок ємності, щоб планувати зупинки без сюрпризів.",
    seoTitle: "Павербанк Volta 20 — 65 Вт і 20 000 мА·год",
    seoDescription:
      "Портативний зарядний пристрій Volta 20 на 20 000 мА·год зі швидкою зарядкою 65 Вт і портами USB-C та USB-A.",
    status: ProductStatus.PUBLISHED,
  },
  {
    slug: "orbit-pro",
    name: "Вебкамера Orbit Pro",
    specs: [
      { label: "Роздільність", value: "4K 30 к/с" },
      { label: "Мікрофони", value: "2, з шумозаглушенням" },
      { label: "Кут огляду", value: "90°" },
      { label: "Кріплення", value: "кліпса, штатив" },
    ],
    description:
      "Матриця 4K передає чітке зображення під час відеодзвінків, стрімів і запису уроків. Два мікрофони з шумозаглушенням відсікають клацання клавіатури й гул кондиціонера, залишаючи голос розбірливим.\n\nШирокий кут 90° охоплює робоче місце, а кліпса й різьба для штатива кріплять камеру на монітор або стійку. Автофокус тримає обличчя в різкості, коли ви нахиляєтесь до екрана.",
    seoTitle: "Вебкамера Orbit Pro — 4K для зустрічей",
    seoDescription:
      "Вебкамера Orbit Pro з записом 4K, двома мікрофонами з шумозаглушенням і кутом огляду 90° для відеодзвінків.",
    status: ProductStatus.PUBLISHED,
  },
  {
    slug: "drift-air",
    name: "Бездротова миша Drift Air",
    specs: [
      { label: "Датчик", value: "26 000 DPI" },
      { label: "Вага", value: "58 г" },
      { label: "З'єднання", value: "2.4 ГГц, Bluetooth" },
      { label: "Автономність", value: "до 70 год" },
    ],
    description:
      "Оптичний датчик на 26 000 DPI точно відстежує рух на тканині, дереві та пластику, а вага 58 г зменшує втому зап’ястя під час довгих сесій. Перемикач DPI дає змогу миттєво змінити чутливість для роботи з таблицями чи ігор.\n\nПідключення через 2.4 ГГц або Bluetooth працює зі стабільним відгуком, а акумулятора вистачає до 70 годин. Форма з м’якими боками зручна для долоні середнього розміру.",
    seoTitle: "Бездротова миша Drift Air — 58 г, 26K DPI",
    seoDescription:
      "Легка бездротова миша Drift Air вагою 58 г з датчиком 26 000 DPI, Bluetooth і радіоканалом 2.4 ГГц.",
    status: ProductStatus.PUBLISHED,
  },
  {
    slug: "pulse-go",
    name: "Портативна колонка Pulse Go",
    specs: [
      { label: "Потужність", value: "20 Вт" },
      { label: "Водозахист", value: "IP67" },
      { label: "Автономність", value: "до 12 год" },
      { label: "Підключення", value: "Bluetooth 5.3" },
    ],
    description:
      "Два динаміки сумарною потужністю 20 Вт дають гучний і зібраний звук на пікніку, на кухні чи на терасі. Bluetooth 5.3 тримає стабільне з’єднання зі смартфоном, а захист IP67 дозволяє користуватися колонкою під дощем і біля води.\n\nЗаряду вистачає до 12 годин відтворення на середній гучності. Гумова окантовка захищає корпус від ударів, а петля зручна для перенесення.",
    seoTitle: "Портативна колонка Pulse Go — 20 Вт, IP67",
    seoDescription:
      "Портативна колонка Pulse Go потужністю 20 Вт із захистом IP67, Bluetooth 5.3 і автономністю до 12 годин.",
    status: ProductStatus.PUBLISHED,
  },
  {
    slug: "zenith-pad",
    name: "Бездротова зарядка Zenith Pad",
    specs: [
      { label: "Потужність", value: "15 Вт" },
      { label: "Стандарт", value: "Qi" },
      { label: "Індикатор", value: "LED" },
      { label: "Живлення", value: "USB-C" },
    ],
    description:
      "Зарядна панель Zenith Pad передає до 15 Вт за стандартом Qi, тож смартфон можна покласти на поверхню без кабелю. Антиковзке покриття утримує пристрій на місці, а світлодіод показує, що зарядка почалася.\n\nТонкий алюмінієвий корпус майже не займає місця на нічному столику чи робочому столі. Живлення йде через USB-C, тому панель легко підключити до адаптера або хаба.",
    seoTitle: "Бездротова зарядка Zenith Pad — 15 Вт Qi",
    seoDescription:
      "Бездротова зарядна панель Zenith Pad потужністю 15 Вт за стандартом Qi з живленням через USB-C.",
    status: ProductStatus.PUBLISHED,
  },
  {
    slug: "terra-flask",
    name: "Термопляшка Terra Flask",
    specs: [
      { label: "Об'єм", value: "750 мл" },
      { label: "Матеріал", value: "нержавіюча сталь" },
      { label: "Збереження тепла", value: "до 12 год" },
      { label: "Кришка", value: "герметична, з ручкою" },
    ],
    description:
      "Подвійні стінки з нержавіючої сталі зберігають напої гарячими до 12 годин і прохолодними протягом дня. Об’єм 750 мл зручний для офісу, подорожі чи тренування, а вузьке горло не розхлюпує рідину.\n\nГерметична кришка з ручкою надійно закручується однією рукою. Зовнішнє покриття не конденсує вологу й не обпікає пальці, навіть коли всередині окріп.",
    seoTitle: "Термопляшка Terra Flask — 750 мл, 12 год",
    seoDescription:
      "Термопляшка Terra Flask на 750 мл зі сталі зберігає тепло до 12 годин і має герметичну кришку з ручкою.",
    status: ProductStatus.PUBLISHED,
  },
  {
    slug: "halo-hub",
    name: "USB-хаб Halo Hub",
    specs: [
      { label: "Порти", value: "HDMI 4K, USB-C, 2× USB-A, SD" },
      { label: "Живлення", value: "USB-C PD 100 Вт" },
      { label: "Корпус", value: "алюміній" },
      { label: "Сумісність", value: "Mac, Windows" },
    ],
    description:
      "Один кабель USB-C відкриває HDMI 4K, два порти USB-A, USB-C і слот для карток SD, тож ноутбуку не бракує роз’ємів на зустрічі чи в дорозі. Наскрізна зарядка PD 100 Вт живить пристрій, поки хаб роздає периферію.\n\nАлюмінієвий корпус розсіює тепло й виглядає стримано поруч із монітором. Halo Hub сумісний із комп’ютерами на macOS і Windows без драйверів.",
    seoTitle: "USB-хаб Halo Hub — HDMI 4K і PD 100 Вт",
    seoDescription:
      "Компактний USB-хаб Halo Hub з HDMI 4K, картридером SD, портами USB і наскрізною зарядкою PD 100 Вт.",
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
  {
    slug: "frost-desk",
    name: "Настільний вентилятор Frost Desk",
    specs: [
      { label: "Діаметр", value: "20 см" },
      { label: "Режими", value: "4 швидкості" },
      { label: "Шум", value: "від 22 дБ" },
      { label: "Живлення", value: "USB-C" },
    ],
    description:
      "Чотири швидкості повітряного потоку дають змогу охолодити робоче місце без протягу. У найтихішому режимі вентилятор працює від 22 дБ, тож його майже не чути під час дзвінків.\n\nКомпактна основа діаметром 20 см стоїть на столі стабільно, а живлення через USB-C підходить і для ноутбука, і для розеткового адаптера.",
    seoTitle: "Настільний вентилятор Frost Desk — тихий",
    seoDescription:
      "Компактний настільний вентилятор Frost Desk з чотирма швидкостями, тихим режимом від 22 дБ і живленням USB-C.",
    status: ProductStatus.DRAFT,
  },
  {
    slug: "nova-lift",
    name: "Підставка для ноутбука Nova Lift",
    specs: [
      { label: "Діагональ", value: "11–16\"" },
      { label: "Кут нахилу", value: "15–45°" },
      { label: "Матеріал", value: "алюміній" },
      { label: "Вага", value: "890 г" },
    ],
    description:
      "Алюмінієва підставка піднімає екран ноутбука 11–16 дюймів ближче до рівня очей і зменшує нахил шиї. Кут регулюється від 15 до 45 градусів, а відкритий каркас покращує вентиляцію корпуса.\n\nВага 890 г дозволяє брати підставку в офіс або кав’ярню. Гумові накладки утримують ноутбук і не дряпають стіл.",
    seoTitle: "Підставка Nova Lift — алюміній, 11–16\"",
    seoDescription:
      "Алюмінієва підставка Nova Lift для ноутбуків 11–16\" з регульованим кутом нахилу та вагою 890 г.",
    status: ProductStatus.DRAFT,
  },
  {
    slug: "echo-cast",
    name: "Мікрофон Echo Cast",
    specs: [
      { label: "Тип", value: "конденсаторний" },
      { label: "Діаграма", value: "кардіоїдна" },
      { label: "Частоти", value: "20 Гц–20 кГц" },
      { label: "З'єднання", value: "USB-C" },
    ],
    description:
      "Кардіоїдний конденсаторний мікрофон знімає голос спереду й приглушує шум кімнати позаду. Частотний діапазон 20 Гц–20 кГц передає мову природно для стрімів, подкастів і дзвінків.\n\nПідключення USB-C не потребує зовнішньої карти звуку: мікрофон з’являється в системі одразу після з’єднання. Металева решітка захищає капсулу, а кільцевий індикатор показує, що запис активний.",
    seoTitle: "Мікрофон Echo Cast — USB для стрімів",
    seoDescription:
      "USB-мікрофон Echo Cast з кардіоїдною діаграмою, частотним діапазоном 20 Гц–20 кГц і підключенням USB-C.",
    status: ProductStatus.DRAFT,
  },
  {
    slug: "atlas-pack",
    name: "Міський рюкзак Atlas Pack",
    specs: [
      { label: "Об'єм", value: "22 л" },
      { label: "Відсік для ноутбука", value: "16\"" },
      { label: "Матеріал", value: "водовідштовхувальний нейлон" },
      { label: "Вага", value: "780 г" },
    ],
    description:
      "Об’єм 22 літри вміщує ноутбук до 16 дюймів, зарядні кабелі та змінний одяг для міського дня. Водовідштовхувальний нейлон захищає речі від короткого дощу, а м’які лямки не тиснуть на плечі.\n\nОкремий задній відсік відкривається ближче до спини, щоб дістати техніку в транспорті. Вага порожнього рюкзака — 780 г, тож він не додає зайвого навантаження.",
    seoTitle: "Рюкзак Atlas Pack — 22 л, відділ 16\"",
    seoDescription:
      "Міський рюкзак Atlas Pack на 22 л з відділом для ноутбука 16\", водостійким нейлоном і вагою 780 г.",
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
  const slugs = seedProducts.map((product) => product.slug);

  if (new Set(slugs).size !== slugs.length) {
    throw new Error("Seed product slugs must be unique.");
  }

  const publishedCount = seedProducts.filter(
    (product) => product.status === ProductStatus.PUBLISHED,
  ).length;
  const draftCount = seedProducts.filter(
    (product) => product.status === ProductStatus.DRAFT,
  ).length;

  if (publishedCount !== 10 || draftCount !== 5) {
    throw new Error(
      `Seed must include 10 published products and 5 drafts, got ${publishedCount} published and ${draftCount} drafts.`,
    );
  }

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
