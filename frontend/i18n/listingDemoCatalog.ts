import type { AppLocale } from "./translations";

/** Demo listing rows — inspirational samples (real bookings use browse-services). */
export type DemoHotel = {
  id: string;
  name: string;
  location: string;
  pricePerNight: number;
  description: string;
  image: string;
  amenities: string[];
  rating: number;
};

export type DemoClinic = {
  id: string;
  name: string;
  location: string;
  consultationFee: number;
  description: string;
  image: string;
  services: string[];
  rating: number;
};

export type DemoGroomer = {
  id: string;
  name: string;
  location: string;
  price: number;
  description: string;
  image: string;
  services: string[];
  rating: number;
};

const IMG = {
  h1: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=750&q=80",
  h2: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=750&q=80",
  h3: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=750&q=80",
  h4: "https://images.unsplash.com/photo-1494256997604-768d1f608cac?auto=format&fit=crop&w=750&q=80",
  h5: "https://images.unsplash.com/photo-1518715308788-3005759c61fc?auto=format&fit=crop&w=750&q=80",
} as const;

const LOC = "Beşiktaş, İstanbul";

export const HOTELS_BY_LOCALE: Record<AppLocale, DemoHotel[]> = {
  en: [
    {
      id: "1",
      name: "Dream Pet Hotel",
      location: LOC,
      pricePerNight: 980,
      description:
        "Your pet's home away from home! Premium comfort, 24/7 care, and plenty of cuddles. Spacious rooms, a playground, and attention to hygiene & diet.",
      image: IMG.h1,
      amenities: [
        "Pet grooming",
        "Veterinary on site",
        "Daily exercise",
        "Play yard",
        "Spa & massage",
        "24/7 supervision",
        "Allergy-safe foods",
      ],
      rating: 4.8,
    },
    {
      id: "2",
      name: "Happy Paws Inn",
      location: "Kadıköy, İstanbul",
      pricePerNight: 725,
      description:
        "A cozy getaway for pets! Indoor/outdoor play, nutritious meals, and caring staff. Safe, clean environment.",
      image: IMG.h2,
      amenities: ["Veterinary on call", "Large play area", "Pet taxi", "Special diets"],
      rating: 4.5,
    },
    {
      id: "3",
      name: "Royal Pet Resort",
      location: "Şişli, İstanbul",
      pricePerNight: 1100,
      description:
        "Luxury suites, spa, grooming, and a play pool — an unforgettable stay for your companion.",
      image: IMG.h3,
      amenities: ["Luxury suites", "Pet spa", "Pool", "24/7 surveillance", "Playground"],
      rating: 4.9,
    },
    {
      id: "4",
      name: "PetCare Hotel",
      location: "Ataşehir, İstanbul",
      pricePerNight: 580,
      description:
        "Affordable comfort: playtime, group or solo stays, and regular vet checks.",
      image: IMG.h4,
      amenities: ["Supervised play", "Regular vet checks", "Flexible pickup"],
      rating: 4.3,
    },
    {
      id: "5",
      name: "City Pet Suites",
      location: "Bakırköy, İstanbul",
      pricePerNight: 880,
      description:
        "Modern suites with video monitoring, allergen-free rooms, and tailored nutrition plans.",
      image: IMG.h5,
      amenities: ["Video monitoring", "Allergy free", "Custom nutrition", "Training"],
      rating: 4.6,
    },
  ],
  tr: [
    {
      id: "1",
      name: "Dream Pet Hotel",
      location: LOC,
      pricePerNight: 980,
      description:
        "Evcil dostunuz için ikinci ev! Premium konfor, 7/24 bakım ve bol ilgi. Geniş odalar, oyun alanı ve hijyen odaklı hizmet.",
      image: IMG.h1,
      amenities: [
        "Pet kuaför",
        "Yerinde veteriner",
        "Günlük egzersiz",
        "Oyun alanı",
        "Spa & masaj",
        "7/24 gözetim",
        "Alerji dostu mama",
      ],
      rating: 4.8,
    },
    {
      id: "2",
      name: "Happy Paws Inn",
      location: "Kadıköy, İstanbul",
      pricePerNight: 725,
      description:
        "Sıcacık bir kaçamak! Kapalı/açık oyun alanları, dengeli öğünler ve deneyimli ekip. Güvenli ve temiz ortam.",
      image: IMG.h2,
      amenities: ["Nöbetçi veteriner", "Geniş oyun alanı", "Pet taksi", "Özel diyetler"],
      rating: 4.5,
    },
    {
      id: "3",
      name: "Royal Pet Resort",
      location: "Şişli, İstanbul",
      pricePerNight: 1100,
      description:
        "Lüks süitler, spa, kuaför ve havuz — dostunuz için üst düzey konaklama.",
      image: IMG.h3,
      amenities: ["Lüks süitler", "Pet spa", "Havuz", "7/24 izleme", "Oyun parkı"],
      rating: 4.9,
    },
    {
      id: "4",
      name: "PetCare Hotel",
      location: "Ataşehir, İstanbul",
      pricePerNight: 580,
      description:
        "Uygun fiyatlı konfor: oyun saatleri, grup veya tekli konaklama, düzenli vet kontrolleri.",
      image: IMG.h4,
      amenities: ["Gözetimli oyun", "Düzenli vet kontrolü", "Esnek teslim alma"],
      rating: 4.3,
    },
    {
      id: "5",
      name: "City Pet Suites",
      location: "Bakırköy, İstanbul",
      pricePerNight: 880,
      description:
        "Modern süitler, video izleme, alerji dostu odalar ve kişisel beslenme planları.",
      image: IMG.h5,
      amenities: ["Video izleme", "Alerji dostu", "Özel beslenme", "Eğitim"],
      rating: 4.6,
    },
  ],
  ru: [
    {
      id: "1",
      name: "Dream Pet Hotel",
      location: LOC,
      pricePerNight: 980,
      description:
        "Второй дом для питомца: комфорт, круглосуточный уход и забота. Просторные номера, площадка и контроль питания.",
      image: IMG.h1,
      amenities: [
        "Груминг",
        "Ветеринар на месте",
        "Ежедневные прогулки",
        "Игровая зона",
        "Спа и массаж",
        "Круглосуточный надзор",
        "Гипоаллергенное питание",
      ],
      rating: 4.8,
    },
    {
      id: "2",
      name: "Happy Paws Inn",
      location: "Кадыкёй, Стамбул",
      pricePerNight: 725,
      description:
        "Уютный отдых для животных: игры внутри и снаружи, полезное питание и внимательный персонал.",
      image: IMG.h2,
      amenities: ["Ветеринар на вызове", "Большая площадка", "Такси для питомцев", "Диеты"],
      rating: 4.5,
    },
    {
      id: "3",
      name: "Royal Pet Resort",
      location: "Шишли, Стамбул",
      pricePerNight: 1100,
      description:
        "Люкс-номера, спа, груминг и бассейн — премиальный отдых для вашего друга.",
      image: IMG.h3,
      amenities: ["Люкс-номера", "Спа", "Бассейн", "Видеонаблюдение", "Площадка"],
      rating: 4.9,
    },
    {
      id: "4",
      name: "PetCare Hotel",
      location: "Аташехир, Стамбул",
      pricePerNight: 580,
      description:
        "Доступный комфорт: игры, групповые или индивидуальные ночёвки, регулярные осмотры врача.",
      image: IMG.h4,
      amenities: ["Игры под присмотром", "Осмотры врача", "Гибкий вывоз"],
      rating: 4.3,
    },
    {
      id: "5",
      name: "City Pet Suites",
      location: "Бакыркёй, Стамбул",
      pricePerNight: 880,
      description:
        "Современные апартаменты с видеоконтролем, гипоаллергенными комнатами и планом питания.",
      image: IMG.h5,
      amenities: ["Видео", "Без аллергенов", "Питание", "Дрессировка"],
      rating: 4.6,
    },
  ],
  ar: [
    {
      id: "1",
      name: "Dream Pet Hotel",
      location: LOC,
      pricePerNight: 980,
      description:
        "منزل ثانٍ لحيوانك! راحة فاخرة ورعاية على مدار الساعة ومساحات واسعة واهتمام بالنظافة والتغذية.",
      image: IMG.h1,
      amenities: ["تجميل", "طبيب بيطري في الموقع", "تمارين يومية", "ساحة لعب", "سبا ومساج", "إشراف 24/7", "طعام مناسب للحساسية"],
      rating: 4.8,
    },
    {
      id: "2",
      name: "Happy Paws Inn",
      location: "كاديكوي، إسطنبول",
      pricePerNight: 725,
      description:
        "إقامة دافئة مع مساحات لعب داخلية وخارجية ووجبات صحية وفريق متفهم. بيئة آمنة ونظيفة.",
      image: IMG.h2,
      amenities: ["طبيب عند الطلب", "مساحة لعب كبيرة", "سيارة للحيوان", "وجبات خاصة"],
      rating: 4.5,
    },
    {
      id: "3",
      name: "Royal Pet Resort",
      location: "شيشلي، إسطنبول",
      pricePerNight: 1100,
      description:
        "أجنحة فاخرة وسبا وعناية ومسبح — تجربة راقية لرفيقك.",
      image: IMG.h3,
      amenities: ["أجنحة فاخرة", "سبا للحيوانات", "مسبح", "مراقبة 24/7", "ملعب"],
      rating: 4.9,
    },
    {
      id: "4",
      name: "PetCare Hotel",
      location: "أتاشهير، إسطنبول",
      pricePerNight: 580,
      description:
        "راحة بأسعار مناسبة: لعب وإقامة جماعية أو فردية وفحوصات بيطرية منتظمة.",
      image: IMG.h4,
      amenities: ["لعب بإشراف", "فحوصات دورية", "استلام مرن"],
      rating: 4.3,
    },
    {
      id: "5",
      name: "City Pet Suites",
      location: "باكيركوي، إسطنبول",
      pricePerNight: 880,
      description:
        "أجنحة عصرية مع مراقبة بالفيديو وغرف مناسبة للحساسية وخطط تغذية مخصصة.",
      image: IMG.h5,
      amenities: ["مراقبة فيديو", "خالي من مسببات الحساسية", "تغذية مخصصة", "تدريب"],
      rating: 4.6,
    },
  ],
  es: [
    {
      id: "1",
      name: "Dream Pet Hotel",
      location: LOC,
      pricePerNight: 980,
      description:
        "¡Un segundo hogar para tu mascota! Confort, atención 24 h y espacios amplios; higiene y alimentación cuidadas.",
      image: IMG.h1,
      amenities: [
        "Peluquería",
        "Veterinario in situ",
        "Ejercicio diario",
        "Patios de juego",
        "Spa y masaje",
        "Supervisión 24/7",
        "Alimentos para alérgicos",
      ],
      rating: 4.8,
    },
    {
      id: "2",
      name: "Happy Paws Inn",
      location: "Kadıköy, Estambul",
      pricePerNight: 725,
      description:
        "¡Un refugio acogedor! Zonas de juego interior/exterior, comidas equilibradas y equipo atento.",
      image: IMG.h2,
      amenities: ["Veterinario de guardia", "Gran zona de juego", "Taxi mascotas", "Dietas especiales"],
      rating: 4.5,
    },
    {
      id: "3",
      name: "Royal Pet Resort",
      location: "Şişli, Estambul",
      pricePerNight: 1100,
      description:
        "Suites de lujo, spa, peluquería y piscina — una estancia inolvidable.",
      image: IMG.h3,
      amenities: ["Suites de lujo", "Spa mascotas", "Piscina", "Vigilancia 24/7", "Parque"],
      rating: 4.9,
    },
    {
      id: "4",
      name: "PetCare Hotel",
      location: "Ataşehir, Estambul",
      pricePerNight: 580,
      description:
        "Confort asequible: juego supervisado, estancias grupales o individuales y revisiones veterinarias.",
      image: IMG.h4,
      amenities: ["Juego supervisado", "Revisiones veterinarias", "Recogida flexible"],
      rating: 4.3,
    },
    {
      id: "5",
      name: "City Pet Suites",
      location: "Bakırköy, Estambul",
      pricePerNight: 880,
      description:
        "Suites modernas con vídeo, habitaciones libres de alérgenos y planes nutricionales.",
      image: IMG.h5,
      amenities: ["Vídeo", "Sin alérgenos", "Nutrición", "Adiestramiento"],
      rating: 4.6,
    },
  ],
  fr: [
    {
      id: "1",
      name: "Dream Pet Hotel",
      location: LOC,
      pricePerNight: 980,
      description:
        "Une seconde maison pour votre animal : confort, soins 24 h/24, chambres spacieuses et alimentation adaptée.",
      image: IMG.h1,
      amenities: [
        "Toilettage",
        "Vétérinaire sur place",
        "Exercice quotidien",
        "Aire de jeu",
        "Spa & massage",
        "Surveillance 24/7",
        "Aliments hypoallergéniques",
      ],
      rating: 4.8,
    },
    {
      id: "2",
      name: "Happy Paws Inn",
      location: "Kadıköy, Istanbul",
      pricePerNight: 725,
      description:
        "Un cadre chaleureux : jeux intérieur/extérieur, repas équilibrés et équipe attentive.",
      image: IMG.h2,
      amenities: ["Vétérinaire à la demande", "Grande aire de jeu", "Taxi animalier", "Régimes spéciaux"],
      rating: 4.5,
    },
    {
      id: "3",
      name: "Royal Pet Resort",
      location: "Şişli, Istanbul",
      pricePerNight: 1100,
      description:
        "Suites luxe, spa, toilettage et piscine — un séjour haut de gamme.",
      image: IMG.h3,
      amenities: ["Suites luxe", "Spa", "Piscine", "Vidéosurveillance", "Aire de jeu"],
      rating: 4.9,
    },
    {
      id: "4",
      name: "PetCare Hotel",
      location: "Ataşehir, Istanbul",
      pricePerNight: 580,
      description:
        "Confort abordable : jeu supervisé, nuitées groupe ou solo et bilans vétérinaires.",
      image: IMG.h4,
      amenities: ["Jeu supervisé", "Contrôles vétérinaires", "Retrait flexible"],
      rating: 4.3,
    },
    {
      id: "5",
      name: "City Pet Suites",
      location: "Bakırköy, Istanbul",
      pricePerNight: 880,
      description:
        "Suites modernes avec vidéo, chambres anti-allergènes et plans nutritionnels.",
      image: IMG.h5,
      amenities: ["Vidéo", "Sans allergènes", "Nutrition", "Éducation"],
      rating: 4.6,
    },
  ],
  de: [
    {
      id: "1",
      name: "Dream Pet Hotel",
      location: LOC,
      pricePerNight: 980,
      description:
        "Ein zweites Zuhause für dein Tier: Komfort, Rund-um-die-Uhr-Betreuung, große Zimmer und Fokus auf Hygiene & Futter.",
      image: IMG.h1,
      amenities: [
        "Grooming",
        "Tierarzt vor Ort",
        "Tägliche Bewegung",
        "Spielplatz",
        "Spa & Massage",
        "24/7 Betreuung",
        "Allergie-armes Futter",
      ],
      rating: 4.8,
    },
    {
      id: "2",
      name: "Happy Paws Inn",
      location: "Kadıköy, Istanbul",
      pricePerNight: 725,
      description:
        "Gemütlicher Rückzugsort mit Indoor-/Outdoor-Spiel, gutem Futter und aufmerksamem Team.",
      image: IMG.h2,
      amenities: ["Tierarzt on call", "Große Spielfläche", "Pet-Taxi", "Sonderdiäten"],
      rating: 4.5,
    },
    {
      id: "3",
      name: "Royal Pet Resort",
      location: "Şişli, Istanbul",
      pricePerNight: 1100,
      description:
        "Luxus-Suiten, Spa, Grooming und Pool — Premium-Aufenthalt für deinen Liebling.",
      image: IMG.h3,
      amenities: ["Luxus-Suiten", "Tier-Spa", "Pool", "Videoüberwachung", "Spielplatz"],
      rating: 4.9,
    },
    {
      id: "4",
      name: "PetCare Hotel",
      location: "Ataşehir, Istanbul",
      pricePerNight: 580,
      description:
        "Günstiger Komfort: betreutes Spielen, Gruppen- oder Einzelübernachtung, regelmäßige Tierarztchecks.",
      image: IMG.h4,
      amenities: ["Betreutes Spielen", "Regelmäßige Checks", "Flexible Abholung"],
      rating: 4.3,
    },
    {
      id: "5",
      name: "City Pet Suites",
      location: "Bakırköy, Istanbul",
      pricePerNight: 880,
      description:
        "Moderne Suiten mit Video, allergenarmen Zimmern und Ernährungsplänen.",
      image: IMG.h5,
      amenities: ["Video", "Allergenarm", "Ernährung", "Training"],
      rating: 4.6,
    },
  ],
};

export const CLINICS_BY_LOCALE: Record<AppLocale, DemoClinic[]> = {
  en: [
    {
      id: "1",
      name: "Paws & Care Vet Clinic",
      location: LOC,
      consultationFee: 370,
      description:
        "Comprehensive care with modern equipment and professional staff. Emergency and dental services available.",
      image: IMG.h1,
      services: ["Emergency care", "Dental cleaning", "Vaccination", "Surgery", "Diagnostics"],
      rating: 4.9,
    },
    {
      id: "2",
      name: "Happy Tails Veterinary",
      location: "Kadıköy, İstanbul",
      consultationFee: 320,
      description:
        "Neighborhood clinic with experienced vets: preventive exams, diagnostics, and nutrition advice.",
      image: IMG.h2,
      services: ["Wellness exams", "Microchipping", "Parasite control", "Nutrition counseling"],
      rating: 4.7,
    },
    {
      id: "3",
      name: "Blue Paw Animal Hospital",
      location: "Şişli, İstanbul",
      consultationFee: 425,
      description:
        "Full-service hospital: surgery, imaging, rehabilitation, and 24/7 emergency care.",
      image: IMG.h3,
      services: ["24/7 emergency", "X-ray & ultrasound", "Physiotherapy", "Specialist vet"],
      rating: 4.8,
    },
    {
      id: "4",
      name: "PetLife Clinic",
      location: "Ataşehir, İstanbul",
      consultationFee: 270,
      description:
        "Trusted clinic focused on preventive medicine and affordable care. In-house pharmacy.",
      image: IMG.h4,
      services: ["Vaccinations", "Nutrition advice", "Pet pharmacy"],
      rating: 4.5,
    },
    {
      id: "5",
      name: "CityVet Poliklinik",
      location: "Bakırköy, İstanbul",
      consultationFee: 390,
      description:
        "Modern facility with diagnostics, advanced treatments, and recovery rooms.",
      image: IMG.h5,
      services: ["Lab diagnostics", "Surgery", "Recovery suites", "Ultrasound"],
      rating: 4.6,
    },
  ],
  tr: [
    {
      id: "1",
      name: "Paws & Care Vet Clinic",
      location: LOC,
      consultationFee: 370,
      description:
        "Modern ekipman ve deneyimli ekip ile kapsayıcı bakım. Acil ve diş hizmetleri.",
      image: IMG.h1,
      services: ["Acil servis", "Diş temizliği", "Aşı", "Cerrahi", "Tanı"],
      rating: 4.9,
    },
    {
      id: "2",
      name: "Happy Tails Veterinary",
      location: "Kadıköy, İstanbul",
      consultationFee: 320,
      description:
        "Mahalle kliniği: koruyucu muayene, tanı ve beslenme danışmanlığı.",
      image: IMG.h2,
      services: ["Genel kontrol", "Mikroçip", "Parazit", "Beslenme"],
      rating: 4.7,
    },
    {
      id: "3",
      name: "Blue Paw Animal Hospital",
      location: "Şişli, İstanbul",
      consultationFee: 425,
      description:
        "Tam donanımlı hastane: cerrahi, görüntüleme, rehabilitasyon ve 7/24 acil.",
      image: IMG.h3,
      services: ["7/24 acil", "Röntgen & USG", "Fizyoterapi", "Uzman hekim"],
      rating: 4.8,
    },
    {
      id: "4",
      name: "PetLife Clinic",
      location: "Ataşehir, İstanbul",
      consultationFee: 270,
      description:
        "Önleyici tıp ve uygun fiyat. Yerinde eczane.",
      image: IMG.h4,
      services: ["Aşılar", "Beslenme", "Eczane"],
      rating: 4.5,
    },
    {
      id: "5",
      name: "CityVet Poliklinik",
      location: "Bakırköy, İstanbul",
      consultationFee: 390,
      description:
        "Modern tanı, ileri tedavi ve iyileşme odaları.",
      image: IMG.h5,
      services: ["Laboratuvar", "Cerrahi", "İyileşme süitleri", "Ultrason"],
      rating: 4.6,
    },
  ],
  ru: [
    {
      id: "1",
      name: "Paws & Care Vet Clinic",
      location: LOC,
      consultationFee: 370,
      description:
        "Комплексный уход, современное оборудование. Неотложка и стоматология.",
      image: IMG.h1,
      services: ["Неотложка", "Чистка зубов", "Вакцинация", "Хирургия", "Диагностика"],
      rating: 4.9,
    },
    {
      id: "2",
      name: "Happy Tails Veterinary",
      location: "Кадыкёй, Стамбул",
      consultationFee: 320,
      description:
        "Клиника района: профилактика, диагностика и консультации по питанию.",
      image: IMG.h2,
      services: ["Осмотры", "Чипирование", "Паразиты", "Питание"],
      rating: 4.7,
    },
    {
      id: "3",
      name: "Blue Paw Animal Hospital",
      location: "Шишли, Стамбул",
      consultationFee: 425,
      description:
        "Полный спектр: хирургия, визуализация, реабилитация и неотложка 24/7.",
      image: IMG.h3,
      services: ["24/7 неотложка", "Рентген и УЗИ", "Физиотерапия", "Специалист"],
      rating: 4.8,
    },
    {
      id: "4",
      name: "PetLife Clinic",
      location: "Аташехир, Стамбул",
      consultationFee: 270,
      description:
        "Надёжная клиника: профилактика и доступные услуги. Аптека на месте.",
      image: IMG.h4,
      services: ["Вакцины", "Питание", "Аптека"],
      rating: 4.5,
    },
    {
      id: "5",
      name: "CityVet Poliklinik",
      location: "Бакыркёй, Стамбул",
      consultationFee: 390,
      description:
        "Современная диагностика, лечение и палаты восстановления.",
      image: IMG.h5,
      services: ["Лаборатория", "Хирургия", "Реабилитация", "УЗИ"],
      rating: 4.6,
    },
  ],
  ar: [
    {
      id: "1",
      name: "Paws & Care Vet Clinic",
      location: LOC,
      consultationFee: 370,
      description:
        "رعاية شاملة بمعدات حديثة وطاقم محترف. خدمات طوارئ وأسنان.",
      image: IMG.h1,
      services: ["طوارئ", "تنظيف أسنان", "تطعيم", "جراحة", "تشخيص"],
      rating: 4.9,
    },
    {
      id: "2",
      name: "Happy Tails Veterinary",
      location: "كاديكوي، إسطنبول",
      consultationFee: 320,
      description:
        "عيادة حيّية: فحوص وقائية وتشخيص وإرشاد تغذية.",
      image: IMG.h2,
      services: ["فحص دوري", "شريحة", "طفيليات", "تغذية"],
      rating: 4.7,
    },
    {
      id: "3",
      name: "Blue Paw Animal Hospital",
      location: "شيشلي، إسطنبول",
      consultationFee: 425,
      description:
        "مستشفى متكامل: جراحة وتصوير وتأهيل وطوارئ على مدار الساعة.",
      image: IMG.h3,
      services: ["طوارئ 24/7", "أشعة وبوق", "علاج طبيعي", "أخصائي"],
      rating: 4.8,
    },
    {
      id: "4",
      name: "PetLife Clinic",
      location: "أتاشهير، إسطنبول",
      consultationFee: 270,
      description:
        "طب وقائي وخدمات بأسعار مناسبة. صيدلية داخلية.",
      image: IMG.h4,
      services: ["تطعيم", "تغذية", "صيدلية"],
      rating: 4.5,
    },
    {
      id: "5",
      name: "CityVet Poliklinik",
      location: "باكيركوي، إسطنبول",
      consultationFee: 390,
      description:
        "تشخيص حديث وعلاج متقدم وغرف تعافي.",
      image: IMG.h5,
      services: ["مختبر", "جراحة", "تعافي", "موجات فوق صوتية"],
      rating: 4.6,
    },
  ],
  es: [
    {
      id: "1",
      name: "Paws & Care Vet Clinic",
      location: LOC,
      consultationFee: 370,
      description:
        "Atención integral con equipo moderno. Urgencias y dental disponibles.",
      image: IMG.h1,
      services: ["Urgencias", "Limpieza dental", "Vacunas", "Cirugía", "Diagnóstico"],
      rating: 4.9,
    },
    {
      id: "2",
      name: "Happy Tails Veterinary",
      location: "Kadıköy, Estambul",
      consultationFee: 320,
      description:
        "Clínica de barrio: chequeos preventivos, diagnóstico y nutrición.",
      image: IMG.h2,
      services: ["Chequeos", "Microchip", "Parásitos", "Nutrición"],
      rating: 4.7,
    },
    {
      id: "3",
      name: "Blue Paw Animal Hospital",
      location: "Şişli, Estambul",
      consultationFee: 425,
      description:
        "Hospital completo: cirugía, imagen, rehabilitación y urgencias 24 h.",
      image: IMG.h3,
      services: ["Urgencias 24 h", "Rayos X y eco", "Fisioterapia", "Especialista"],
      rating: 4.8,
    },
    {
      id: "4",
      name: "PetLife Clinic",
      location: "Ataşehir, Estambul",
      consultationFee: 270,
      description:
        "Medicina preventiva y precios accesibles. Farmacia interna.",
      image: IMG.h4,
      services: ["Vacunas", "Nutrición", "Farmacia"],
      rating: 4.5,
    },
    {
      id: "5",
      name: "CityVet Poliklinik",
      location: "Bakırköy, Estambul",
      consultationFee: 390,
      description:
        "Diagnóstico moderno, tratamientos avanzados y salas de recuperación.",
      image: IMG.h5,
      services: ["Laboratorio", "Cirugía", "Recuperación", "Ecografía"],
      rating: 4.6,
    },
  ],
  fr: [
    {
      id: "1",
      name: "Paws & Care Vet Clinic",
      location: LOC,
      consultationFee: 370,
      description:
        "Soins complets avec équipement moderne. Urgences et dentaire disponibles.",
      image: IMG.h1,
      services: ["Urgences", "Détartrage", "Vaccination", "Chirurgie", "Diagnostic"],
      rating: 4.9,
    },
    {
      id: "2",
      name: "Happy Tails Veterinary",
      location: "Kadıköy, Istanbul",
      consultationFee: 320,
      description:
        "Clinique de quartier : prévention, diagnostic et conseils nutritionnels.",
      image: IMG.h2,
      services: ["Bilans", "Puce", "Parasites", "Nutrition"],
      rating: 4.7,
    },
    {
      id: "3",
      name: "Blue Paw Animal Hospital",
      location: "Şişli, Istanbul",
      consultationFee: 425,
      description:
        "Hôpital complet : chirurgie, imagerie, rééducation et urgences 24 h/24.",
      image: IMG.h3,
      services: ["Urgences 24/7", "Radio & écho", "Physio", "Spécialiste"],
      rating: 4.8,
    },
    {
      id: "4",
      name: "PetLife Clinic",
      location: "Ataşehir, Istanbul",
      consultationFee: 270,
      description:
        "Médecine préventive et tarifs accessibles. Pharmacie sur place.",
      image: IMG.h4,
      services: ["Vaccins", "Nutrition", "Pharmacie"],
      rating: 4.5,
    },
    {
      id: "5",
      name: "CityVet Poliklinik",
      location: "Bakırköy, Istanbul",
      consultationFee: 390,
      description:
        "Diagnostic moderne, soins avancés et salles de récupération.",
      image: IMG.h5,
      services: ["Labo", "Chirurgie", "Convalescence", "Échographie"],
      rating: 4.6,
    },
  ],
  de: [
    {
      id: "1",
      name: "Paws & Care Vet Clinic",
      location: LOC,
      consultationFee: 370,
      description:
        "Rundum-Betreuung mit moderner Ausstattung. Notfall und Zahnmedizin.",
      image: IMG.h1,
      services: ["Notfall", "Zahnreinigung", "Impfung", "OP", "Diagnostik"],
      rating: 4.9,
    },
    {
      id: "2",
      name: "Happy Tails Veterinary",
      location: "Kadıköy, Istanbul",
      consultationFee: 320,
      description:
        "Nachbarschaftsklinik: Vorsorge, Diagnostik und Ernährungsberatung.",
      image: IMG.h2,
      services: ["Wellness", "Chip", "Parasiten", "Ernährung"],
      rating: 4.7,
    },
    {
      id: "3",
      name: "Blue Paw Animal Hospital",
      location: "Şişli, Istanbul",
      consultationFee: 425,
      description:
        "Vollklinik: Chirurgie, Bildgebung, Reha und 24/7-Notfall.",
      image: IMG.h3,
      services: ["24/7 Notfall", "Röntgen & US", "Physio", "Spezialist"],
      rating: 4.8,
    },
    {
      id: "4",
      name: "PetLife Clinic",
      location: "Ataşehir, Istanbul",
      consultationFee: 270,
      description:
        "Prävention und faire Preise. Hausapotheke.",
      image: IMG.h4,
      services: ["Impfungen", "Ernährung", "Apotheke"],
      rating: 4.5,
    },
    {
      id: "5",
      name: "CityVet Poliklinik",
      location: "Bakırköy, Istanbul",
      consultationFee: 390,
      description:
        "Moderne Diagnostik, Therapie und Erholungsräume.",
      image: IMG.h5,
      services: ["Labor", "OP", "Recovery", "Ultraschall"],
      rating: 4.6,
    },
  ],
};

export const GROOMERS_BY_LOCALE: Record<AppLocale, DemoGroomer[]> = {
  en: [
    {
      id: "1",
      name: "Pati Kuaför",
      location: LOC,
      price: 350,
      description:
        "Gentle grooming and stylish trims! Hygiene, caring staff, and professional service.",
      image: IMG.h5,
      services: ["Nail trim", "Bath & dry", "Hair trim", "Ear cleaning", "Deodorizing", "Expert team"],
      rating: 4.7,
    },
    {
      id: "2",
      name: "Pet Style Studio",
      location: "Kadıköy, İstanbul",
      price: 420,
      description:
        "Trendy cuts, organic products, and spa — boutique experience for cats and dogs.",
      image: IMG.h1,
      services: ["Creative styling", "Spa massage", "Perfume", "Skin care", "Detangling"],
      rating: 4.9,
    },
    {
      id: "3",
      name: "Şık Pati Kuaför",
      location: "Şişli, İstanbul",
      price: 390,
      description:
        "Professional care in a sterile environment. Equipment suited to every coat type.",
      image: IMG.h2,
      services: ["Bath", "Brushing", "Foam therapy", "Cat/rabbit groom", "Sanitary trim"],
      rating: 4.5,
    },
    {
      id: "4",
      name: "Mavi Pati Grooming",
      location: "Ataşehir, İstanbul",
      price: 320,
      description:
        "Budget-friendly prices and experienced groomers. Comfortable options for all sizes.",
      image: IMG.h4,
      services: ["Maintenance check", "Shedding cleanup", "Small breed trim", "Large breed trim"],
      rating: 4.2,
    },
    {
      id: "5",
      name: "Deluxe Pet Beauty",
      location: "Bakırköy, İstanbul",
      price: 480,
      description:
        "Luxury care, premium shampoos, and accessories. Appointment-only, personal attention.",
      image: IMG.h3,
      services: ["VIP grooming", "Accessories", "Organic shampoo", "Blow-dry & style", "Coat renewal"],
      rating: 4.8,
    },
  ],
  tr: [
    {
      id: "1",
      name: "Pati Kuaför",
      location: LOC,
      price: 350,
      description:
        "Sevimli dostlarınıza özel bakım ve şık tıraş! Hijyen, nazik yaklaşım ve profesyonel ekip.",
      image: IMG.h5,
      services: ["Tırnak kesimi", "Banyo & kurutma", "Tüy tıraşı", "Kulak temizliği", "Koku giderme", "Uzman kadro"],
      rating: 4.7,
    },
    {
      id: "2",
      name: "Pet Style Studio",
      location: "Kadıköy, İstanbul",
      price: 420,
      description:
        "Trend modeller, organik ürünler ve spa — kedi ve köpek için butik deneyim.",
      image: IMG.h1,
      services: ["Tıraş tasarımı", "Spa masajı", "Parfüm", "Cilt bakımı", "Tüy açıcı"],
      rating: 4.9,
    },
    {
      id: "3",
      name: "Şık Pati Kuaför",
      location: "Şişli, İstanbul",
      price: 390,
      description:
        "Steril ortamda profesyonel bakım. Her tüy yapısına uygun ekipman.",
      image: IMG.h2,
      services: ["Banyo", "Tarama", "Köpük tedavisi", "Kedi/tavşan", "Hijyenik tıraş"],
      rating: 4.5,
    },
    {
      id: "4",
      name: "Mavi Pati Grooming",
      location: "Ataşehir, İstanbul",
      price: 320,
      description:
        "Uygun fiyat, deneyimli groomer. Küçük ve büyük ırklar için konforlu seçenekler.",
      image: IMG.h4,
      services: ["Bakım kontrolü", "Dökülen tüy", "Küçük ırk tıraşı", "Büyük ırk tıraşı"],
      rating: 4.2,
    },
    {
      id: "5",
      name: "Deluxe Pet Güzellik",
      location: "Bakırköy, İstanbul",
      price: 480,
      description:
        "Lüks bakım, özel şampuanlar ve aksesuarlar. Randevulu servis ve bire bir ilgi.",
      image: IMG.h3,
      services: ["VIP bakım", "Aksesuar", "Organik şampuan", "Fön & stil", "Tüy yenileme"],
      rating: 4.8,
    },
  ],
  ru: [
    {
      id: "1",
      name: "Pati Kuaför",
      location: LOC,
      price: 350,
      description:
        "Нежный груминг и стильные стрижки. Гигиена и профессиональная команда.",
      image: IMG.h5,
      services: ["Когти", "Мытьё и сушка", "Стрижка", "Уши", "Дезодор", "Эксперты"],
      rating: 4.7,
    },
    {
      id: "2",
      name: "Pet Style Studio",
      location: "Кадыкёй, Стамбул",
      price: 420,
      description:
        "Модные формы, органика и спа — бутик-опыт для кошек и собак.",
      image: IMG.h1,
      services: ["Креатив", "Спа", "Парфюм", "Кожа", "Распутывание"],
      rating: 4.9,
    },
    {
      id: "3",
      name: "Şık Pati Kuaför",
      location: "Шишли, Стамбул",
      price: 390,
      description:
        "Профессиональный уход в стерильной среде. Оборудование под любой тип шерсти.",
      image: IMG.h2,
      services: ["Ванна", "Расчёска", "Пена", "Кролик/кот", "Гигиена"],
      rating: 4.5,
    },
    {
      id: "4",
      name: "Mavi Pati Grooming",
      location: "Аташехир, Стамбул",
      price: 320,
      description:
        "Доступные цены и опытные грумеры. Удобно для любых размеров.",
      image: IMG.h4,
      services: ["Осмотр", "Линька", "Малые породы", "Крупные породы"],
      rating: 4.2,
    },
    {
      id: "5",
      name: "Deluxe Pet Beauty",
      location: "Бакыркёй, Стамбул",
      price: 480,
      description:
        "Люкс-уход, премиум шампуни и аксессуары. Только по записи.",
      image: IMG.h3,
      services: ["VIP", "Аксессуары", "Органика", "Укладка", "Шерсть"],
      rating: 4.8,
    },
  ],
  ar: [
    {
      id: "1",
      name: "Pati Kuaför",
      location: LOC,
      price: 350,
      description:
        "عناية لطيفة وتسريحات أنيقة. نظافة وفريق محترف.",
      image: IMG.h5,
      services: ["قص أظافر", "حمام وتجفيف", "قص فراء", "أذن", "إزالة رائحة", "خبراء"],
      rating: 4.7,
    },
    {
      id: "2",
      name: "Pet Style Studio",
      location: "كاديكوي، إسطنبول",
      price: 420,
      description:
        "قصات عصرية ومنتجات عضوية وسبا — تجربة فاخرة للقطط والكلاب.",
      image: IMG.h1,
      services: ["تصميم", "سبا", "عطر", "عناية بالجلد", "فك تشابك"],
      rating: 4.9,
    },
    {
      id: "3",
      name: "Şık Pati Kuaför",
      location: "شيشلي، إسطنبول",
      price: 390,
      description:
        "عناية احترافية في بيئة معقمة. معدات لكل نوع فراء.",
      image: IMG.h2,
      services: ["حمام", "تمشيط", "رغوة", "أرنب/قط", "تشذيب صحي"],
      rating: 4.5,
    },
    {
      id: "4",
      name: "Mavi Pati Grooming",
      location: "أتاشهير، إسطنبول",
      price: 320,
      description:
        "أسعار مناسبة وخبراء — خيارات مريحة لجميع الأحجام.",
      image: IMG.h4,
      services: ["فحص", "تساقط الفراء", "سلالة صغيرة", "سلالة كبيرة"],
      rating: 4.2,
    },
    {
      id: "5",
      name: "Deluxe Pet Beauty",
      location: "باكيركوي، إسطنبول",
      price: 480,
      description:
        "عناية فاخرة وشامبو فاخر وإكسسوارات. حسب الموعد فقط.",
      image: IMG.h3,
      services: ["VIP", "إكسسوارات", "عضوي", "تجفيف وتصفيف", "تجديد الفراء"],
      rating: 4.8,
    },
  ],
  es: [
    {
      id: "1",
      name: "Pati Kuaför",
      location: LOC,
      price: 350,
      description:
        "Peluquería suave y cortes con estilo. Higiene y equipo profesional.",
      image: IMG.h5,
      services: ["Uñas", "Baño y secado", "Corte", "Orejas", "Desodor", "Expertos"],
      rating: 4.7,
    },
    {
      id: "2",
      name: "Pet Style Studio",
      location: "Kadıköy, Estambul",
      price: 420,
      description:
        "Cortes de tendencia, productos orgánicos y spa — experiencia boutique.",
      image: IMG.h1,
      services: ["Estilo", "Spa", "Perfume", "Piel", "Desenredos"],
      rating: 4.9,
    },
    {
      id: "3",
      name: "Şık Pati Kuaför",
      location: "Şişli, Estambul",
      price: 390,
      description:
        "Cuidado profesional en entorno estéril. Equipo para cada tipo de pelaje.",
      image: IMG.h2,
      services: ["Baño", "Cepillo", "Espuma", "Conejo/gato", "Higiene"],
      rating: 4.5,
    },
    {
      id: "4",
      name: "Mavi Pati Grooming",
      location: "Ataşehir, Estambul",
      price: 320,
      description:
        "Precios accesibles y groomers expertos. Opciones para todos los tamaños.",
      image: IMG.h4,
      services: ["Revisión", "Muda", "Raza pequeña", "Raza grande"],
      rating: 4.2,
    },
    {
      id: "5",
      name: "Deluxe Pet Beauty",
      location: "Bakırköy, Estambul",
      price: 480,
      description:
        "Cuidado de lujo, champús premium y accesorios. Solo con cita.",
      image: IMG.h3,
      services: ["VIP", "Accesorios", "Orgánico", "Secado", "Pelaje"],
      rating: 4.8,
    },
  ],
  fr: [
    {
      id: "1",
      name: "Pati Kuaför",
      location: LOC,
      price: 350,
      description:
        "Toilettage doux et coupes stylées. Hygiène et équipe pro.",
      image: IMG.h5,
      services: ["Ongles", "Bain & séchage", "Coupe", "Oreilles", "Odeur", "Experts"],
      rating: 4.7,
    },
    {
      id: "2",
      name: "Pet Style Studio",
      location: "Kadıköy, Istanbul",
      price: 420,
      description:
        "Coupes tendance, produits bio et spa — expérience boutique.",
      image: IMG.h1,
      services: ["Style", "Spa", "Parfum", "Peau", "Démêlage"],
      rating: 4.9,
    },
    {
      id: "3",
      name: "Şık Pati Kuaför",
      location: "Şişli, Istanbul",
      price: 390,
      description:
        "Soins pro en environnement stérile. Matériel adapté à chaque pelage.",
      image: IMG.h2,
      services: ["Bain", "Brosse", "Mousse", "Lapin/chat", "Hygiène"],
      rating: 4.5,
    },
    {
      id: "4",
      name: "Mavi Pati Grooming",
      location: "Ataşehir, Istanbul",
      price: 320,
      description:
        "Prix accessibles et groomers expérimentés. Toutes tailles.",
      image: IMG.h4,
      services: ["Contrôle", "Mue", "Petite race", "Grande race"],
      rating: 4.2,
    },
    {
      id: "5",
      name: "Deluxe Pet Beauty",
      location: "Bakırköy, Istanbul",
      price: 480,
      description:
        "Soins luxe, shampoings premium et accessoires. Sur rendez-vous.",
      image: IMG.h3,
      services: ["VIP", "Accessoires", "Bio", "Brushing", "Pelage"],
      rating: 4.8,
    },
  ],
  de: [
    {
      id: "1",
      name: "Pati Kuaför",
      location: LOC,
      price: 350,
      description:
        "Sanftes Grooming und stylische Schnitte. Hygiene und Profis.",
      image: IMG.h5,
      services: ["Krallen", "Bad & Föhn", "Schnitt", "Ohren", "Geruch", "Team"],
      rating: 4.7,
    },
    {
      id: "2",
      name: "Pet Style Studio",
      location: "Kadıköy, Istanbul",
      price: 420,
      description:
        "Trend-Schnitte, Bio-Produkte und Spa — Boutique-Erlebnis.",
      image: IMG.h1,
      services: ["Styling", "Spa", "Duft", "Haut", "Entfilzen"],
      rating: 4.9,
    },
    {
      id: "3",
      name: "Şık Pati Kuaför",
      location: "Şişli, Istanbul",
      price: 390,
      description:
        "Professionelle Pflege in steriler Umgebung. Für jedes Fell.",
      image: IMG.h2,
      services: ["Bad", "Bürste", "Schaum", "Kaninchen/Katze", "Hygiene"],
      rating: 4.5,
    },
    {
      id: "4",
      name: "Mavi Pati Grooming",
      location: "Ataşehir, Istanbul",
      price: 320,
      description:
        "Günstige Preise und erfahrene Groomer. Alle Größen.",
      image: IMG.h4,
      services: ["Check", "Fellwechsel", "Klein", "Groß"],
      rating: 4.2,
    },
    {
      id: "5",
      name: "Deluxe Pet Beauty",
      location: "Bakırköy, Istanbul",
      price: 480,
      description:
        "Luxuspflege, Premium-Shampoos und Zubehör. Nur mit Termin.",
      image: IMG.h3,
      services: ["VIP", "Zubehör", "Bio", "Fön", "Fell"],
      rating: 4.8,
    },
  ],
};

export function hotelsForLocale(locale: AppLocale): DemoHotel[] {
  return HOTELS_BY_LOCALE[locale] ?? HOTELS_BY_LOCALE.en;
}

export function clinicsForLocale(locale: AppLocale): DemoClinic[] {
  return CLINICS_BY_LOCALE[locale] ?? CLINICS_BY_LOCALE.en;
}

export function groomersForLocale(locale: AppLocale): DemoGroomer[] {
  return GROOMERS_BY_LOCALE[locale] ?? GROOMERS_BY_LOCALE.en;
}
