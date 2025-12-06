import type { Exercise, MuscleGroup } from "@shared/schema";
import { MUSCLE_GROUPS } from "@shared/schema";

function createExerciseDB(): Exercise[] {
  const exercises: Exercise[] = [];
  const add = (id: string, name: string, muscle: MuscleGroup, type: 'compound' | 'isolation', technique: string) => {
    exercises.push({ id, name, muscle, type, technique });
  };

  // --- ГРУДЬ (CHEST) ---
  add('bp_bb_flat', 'Жим штанги лежа', 'chest', 'compound', 'Классика. Лопатки сведены, мост, опускание на низ груди.');
  add('bp_bb_inc', 'Жим штанги на наклонной', 'chest', 'compound', 'Акцент на верх груди. Угол 30-45 градусов.');
  add('bp_bb_dec', 'Жим штанги на обратной наклонной', 'chest', 'compound', 'Акцент на низ груди.');
  add('bp_db_flat', 'Жим гантелей лежа', 'chest', 'compound', 'Растяжение внизу, сведение вверху.');
  add('bp_db_inc', 'Жим гантелей на наклонной', 'chest', 'compound', 'Верх груди, контроль плеч.');
  add('bp_db_dec', 'Жим гантелей на обратной наклонной', 'chest', 'compound', 'Низ груди.');
  add('bp_smith_flat', 'Жим в Смите лежа', 'chest', 'compound', 'Изолированная работа грудных без стабилизации.');
  add('bp_smith_inc', 'Жим в Смите на наклонной', 'chest', 'compound', 'Верх груди в тренажере.');
  add('bp_mach_press', 'Жим в грудном тренажере (сидя)', 'chest', 'compound', 'Безопасный жим с фиксированной траекторией.');
  add('fly_db_flat', 'Разводка гантелей лежа', 'chest', 'isolation', 'Локти чуть согнуты, движение по дуге.');
  add('fly_db_inc', 'Разводка гантелей на наклонной', 'chest', 'isolation', 'Растяжение верха груди.');
  add('fly_pec_deck', 'Сведения в тренажере (Бабочка)', 'chest', 'isolation', 'Локти на уровне плеч, пиковое сокращение.');
  add('cross_high', 'Кроссовер (верхние блоки)', 'chest', 'isolation', 'Сведение рук вниз перед собой (низ груди).');
  add('cross_mid', 'Кроссовер (средние блоки)', 'chest', 'isolation', 'Сведение рук перед грудью.');
  add('cross_low', 'Кроссовер (нижние блоки)', 'chest', 'isolation', 'Сведение рук вверх (верх груди).');
  add('dips_chest', 'Отжимания на брусьях (грудь)', 'chest', 'compound', 'Корпус наклонен вперед, локти в стороны.');
  add('pushup_std', 'Отжимания от пола (классика)', 'chest', 'compound', 'Тело ровное, касание грудью пола.');
  add('pushup_wide', 'Отжимания широким хватом', 'chest', 'compound', 'Больше акцент на грудь, меньше на трицепс.');

  // --- СПИНА (BACK) ---
  add('dl_classic', 'Становая тяга (классика)', 'back', 'compound', 'Базовое упражнение. Спина прямая, штанга по ногам.');
  add('dl_sumo', 'Становая тяга (сумо)', 'back', 'compound', 'Широкая стойка, акцент на ноги и спину.');
  add('dl_rack', 'Тяга с плинтов (Rack Pull)', 'back', 'compound', 'Частичная становая тяга для верха спины.');
  add('pullup_wide', 'Подтягивания широким хватом', 'back', 'compound', 'К груди, локти в стороны.');
  add('pullup_narrow', 'Подтягивания узким хватом', 'back', 'compound', 'Больше амплитуда для широчайших.');
  add('chinup', 'Подтягивания обратным хватом', 'back', 'compound', 'Акцент на бицепс и низ широчайших.');
  add('lat_pull_wide', 'Тяга верхнего блока (широкая)', 'back', 'isolation', 'Аналог подтягиваний, контроль лопаток.');
  add('lat_pull_rev', 'Тяга верхнего блока (обратная)', 'back', 'isolation', 'Хват снизу, к низу груди.');
  add('lat_pull_vbar', 'Тяга верхнего блока (V-рукоять)', 'back', 'isolation', 'Нейтральный хват, низ широчайших.');
  add('lat_pull_straight', 'Пуловер на блоке (прямые руки)', 'back', 'isolation', 'Изоляция широчайших, локти прямые.');
  add('row_bb_bent', 'Тяга штанги в наклоне', 'back', 'compound', 'Корпус 45 градусов, тяга к поясу.');
  add('row_bb_rev', 'Тяга штанги обратным хватом', 'back', 'compound', 'Локти ближе к корпусу, бицепс участвует.');
  add('row_db_one', 'Тяга гантели одной рукой', 'back', 'compound', 'Упор о скамью, спина параллельна полу.');
  add('row_tbar', 'Тяга Т-грифа', 'back', 'compound', 'Узкий хват, акцент на середину спины.');
  add('row_cable_sit', 'Тяга горизонтального блока', 'back', 'isolation', 'Сидя, спина прямая, сводить лопатки.');
  add('face_pull', 'Тяга к лицу (Face Pull)', 'back', 'isolation', 'Канат к переносице, задняя дельта и верх спины.');
  add('shrug_bb', 'Шраги со штангой', 'back', 'isolation', 'Подъем плеч к ушам, трапеции.');
  add('shrug_db', 'Шраги с гантелями', 'back', 'isolation', 'Трапеции, руки по швам.');
  add('hyperext', 'Гиперэкстензия', 'back', 'isolation', 'Разгибатели спины и ягодицы.');

  // --- НОГИ (LEGS) ---
  add('sq_bb_back', 'Приседания со штангой (на спине)', 'legs', 'compound', 'Король упражнений. Таз назад, колени в стороны.');
  add('sq_bb_front', 'Фронтальные приседания', 'legs', 'compound', 'Штанга на груди, акцент на квадрицепс.');
  add('sq_smith', 'Приседания в Смите', 'legs', 'compound', 'Фиксированная траектория, можно выставить ноги вперед.');
  add('sq_goblet', 'Гоблет-приседания (с гирей)', 'legs', 'compound', 'Гиря у груди, глубокий сед.');
  add('sq_sumo_db', 'Приседания плие (сумо)', 'legs', 'compound', 'Широкая стойка, гантель между ног.');
  add('lp_45', 'Жим ногами (платформа)', 'legs', 'compound', 'Большой вес, поясница прижата.');
  add('lp_wide', 'Жим ногами (широкая постановка)', 'legs', 'compound', 'Акцент на приводящие и ягодицы.');
  add('hack_sq', 'Гакк-приседания', 'legs', 'compound', 'Тренажер, спина прижата, квадрицепс.');
  add('lunge_walk', 'Шагающие выпады', 'legs', 'compound', 'Динамика, длинный шаг.');
  add('lunge_bb', 'Выпады со штангой на месте', 'legs', 'compound', 'Статика, контроль равновесия.');
  add('lunge_back', 'Обратные выпады', 'legs', 'compound', 'Шаг назад, безопаснее для колен.');
  add('split_sq_bulg', 'Болгарские сплит-приседания', 'legs', 'compound', 'Одна нога на скамье сзади.');
  add('step_up', 'Зашагивания на тумбу', 'legs', 'compound', 'Подъем за счет силы одной ноги.');
  add('rdl_bb', 'Румынская тяга (штанга)', 'legs', 'compound', 'Ноги чуть согнуты, таз назад, бицепс бедра.');
  add('rdl_db', 'Румынская тяга (гантели)', 'legs', 'compound', 'Гантели скользят вдоль ног.');
  add('leg_ext', 'Разгибания ног сидя', 'legs', 'isolation', 'Изоляция квадрицепса, пиковое сокращение.');
  add('leg_curl_lie', 'Сгибания ног лежа', 'legs', 'isolation', 'Бицепс бедра, не отрывать таз.');
  add('leg_curl_sit', 'Сгибания ног сидя', 'legs', 'isolation', 'Бицепс бедра в растянутом положении.');
  add('calf_stand', 'Подъем на носки стоя', 'legs', 'isolation', 'Икроножные мышцы.');
  add('calf_sit', 'Подъем на носки сидя', 'legs', 'isolation', 'Камбаловидная мышца.');
  add('hip_thrust', 'Ягодичный мост (штанга)', 'legs', 'compound', 'Лучшее для ягодиц. Лопатки на скамье.');
  add('glute_bridge', 'Ягодичный мостик (с пола)', 'legs', 'isolation', 'Упрощенная версия моста.');
  add('kickback_cable', 'Махи ногой назад (кроссовер)', 'legs', 'isolation', 'Изоляция ягодиц.');
  add('abduction_mach', 'Разведение ног в тренажере', 'legs', 'isolation', 'Средняя ягодичная.');
  add('adduction_mach', 'Сведение ног в тренажере', 'legs', 'isolation', 'Приводящие мышцы.');

  // --- ПЛЕЧИ (SHOULDERS) ---
  add('ohp_bb', 'Армейский жим (стоя)', 'shoulders', 'compound', 'База для плеч. Штанга с груди.');
  add('ohp_db', 'Жим гантелей сидя', 'shoulders', 'compound', 'Стабильный корпус, полная амплитуда.');
  add('ohp_smith', 'Жим в Смите сидя', 'shoulders', 'compound', 'Безопасный жим, контроль.');
  add('arnold_press', 'Жим Арнольда', 'shoulders', 'compound', 'С разворотом кистей, проработка всех пучков.');
  add('lat_raise_db', 'Махи гантелями в стороны', 'shoulders', 'isolation', 'Средняя дельта. Локти выше кистей.');
  add('lat_raise_cable', 'Махи в стороны на блоке', 'shoulders', 'isolation', 'Постоянное напряжение.');
  add('front_raise_db', 'Подъем гантелей перед собой', 'shoulders', 'isolation', 'Передняя дельта.');
  add('front_raise_bb', 'Подъем штанги перед собой', 'shoulders', 'isolation', 'Передняя дельта.');
  add('rear_fly_db', 'Махи в наклоне', 'shoulders', 'isolation', 'Задняя дельта.');
  add('rear_pec_deck', 'Обратная бабочка (Pec Deck)', 'shoulders', 'isolation', 'Задняя дельта, локти назад.');
  add('upright_row', 'Тяга штанги к подбородку', 'shoulders', 'compound', 'Средняя дельта и трапеция. Широкий хват.');
  add('face_pull_delt', 'Тяга к лицу (акцент на плечи)', 'shoulders', 'isolation', 'Локти высоко, задняя дельта.');

  // --- РУКИ (ARMS) ---
  add('bic_bb_stand', 'Подъем штанги на бицепс (стоя)', 'arms', 'isolation', 'Классика. Прямой гриф или EZ.');
  add('bic_db_sup', 'Подъем гантелей с супинацией', 'arms', 'isolation', 'Разворот кисти при подъеме.');
  add('bic_hammer', 'Молотки', 'arms', 'isolation', 'Нейтральный хват, брахиалис.');
  add('bic_scott', 'Сгибания на скамье Скотта', 'arms', 'isolation', 'Изоляция, нет читинга.');
  add('bic_conc', 'Концентрированный подъем', 'arms', 'isolation', 'Сидя, упор локтем в бедро.');
  add('bic_cable', 'Сгибания на нижнем блоке', 'arms', 'isolation', 'Равномерная нагрузка.');
  add('bic_spider', 'Паучьи сгибания', 'arms', 'isolation', 'Лежа животом на наклонной скамье.');
  add('tri_close_press', 'Жим узким хватом', 'arms', 'compound', 'База для трицепса. Локти вдоль тела.');
  add('dips_tri', 'Отжимания на брусьях (трицепс)', 'arms', 'compound', 'Корпус прямо, локти назад.');
  add('tri_pushdown', 'Разгибания на блоке (канат)', 'arms', 'isolation', 'Локти прижаты, пиковое сокращение.');
  add('tri_pushdown_bar', 'Разгибания на блоке (рукоять)', 'arms', 'isolation', 'Прямая или V-рукоять.');
  add('tri_overhead', 'Французский жим стоя', 'arms', 'isolation', 'Гантель или гриф за головой.');
  add('tri_kick', 'Разгибание руки в наклоне (Kickback)', 'arms', 'isolation', 'Фиксация плеча, движение предплечья.');
  add('tri_skull', 'Французский жим лежа', 'arms', 'isolation', 'Штанга или гантели ко лбу.');
  add('forearm_curl', 'Сгибания запястий', 'arms', 'isolation', 'Предплечья на коленях или скамье.');
  add('forearm_ext', 'Разгибания запястий', 'arms', 'isolation', 'Обратные сгибания для предплечий.');

  // --- КОР (ABS) ---
  add('crunch', 'Скручивания', 'abs', 'isolation', 'Классика. Подъем лопаток, округление спины.');
  add('crunch_rev', 'Обратные скручивания', 'abs', 'isolation', 'Подъем таза к груди.');
  add('plank', 'Планка', 'abs', 'isolation', 'Статика. Тело в линию, пресс напряжен.');
  add('plank_side', 'Боковая планка', 'abs', 'isolation', 'Косые мышцы, удержание на боку.');
  add('leg_raise_hang', 'Подъем ног в висе', 'abs', 'isolation', 'Без раскачки, контроль таза.');
  add('leg_raise_lie', 'Подъем ног лежа', 'abs', 'isolation', 'Поясница прижата к полу.');
  add('ab_wheel', 'Ролик для пресса', 'abs', 'isolation', 'Выкат и возврат, спина нейтральна.');
  add('cable_crunch', 'Скручивания на блоке', 'abs', 'isolation', 'Стоя на коленях, тяга к полу.');
  add('russian_twist', 'Русские скручивания', 'abs', 'isolation', 'Повороты корпуса с весом.');
  add('dead_bug', 'Мертвый жук', 'abs', 'isolation', 'Противоположные рука и нога.');
  add('mountain_climb', 'Альпинист', 'abs', 'isolation', 'Динамичная планка, подтягивание колен.');

  // --- КАРДИО (CARDIO) ---
  add('run_tread', 'Бег на дорожке', 'cardio', 'compound', 'Темп и наклон регулируются.');
  add('run_outdoor', 'Бег на улице', 'cardio', 'compound', 'Естественный рельеф.');
  add('bike_stat', 'Велотренажер', 'cardio', 'compound', 'Сопротивление и каденс.');
  add('bike_outdoor', 'Велосипед (улица)', 'cardio', 'compound', 'Катание на открытом воздухе.');
  add('row_erg', 'Гребной тренажер', 'cardio', 'compound', 'Все тело, мощная тяга.');
  add('stair_climber', 'Степпер / Лестница', 'cardio', 'compound', 'Нагрузка на ноги и кардио.');
  add('elliptical', 'Эллипс', 'cardio', 'compound', 'Низкий удар на суставы.');
  add('jump_rope', 'Скакалка', 'cardio', 'compound', 'Координация и выносливость.');
  add('hiit_gen', 'HIIT (общий)', 'cardio', 'compound', 'Интервальная тренировка.');
  add('swimming', 'Плавание', 'cardio', 'compound', 'Все мышцы, нагрузка на суставы минимальна.');

  return exercises;
}

export const FULL_EXERCISE_DB = createExerciseDB();

export function getExerciseById(id: string): Exercise | undefined {
  return FULL_EXERCISE_DB.find(e => e.id === id);
}

export function getExercisesByMuscle(muscle: MuscleGroup): Exercise[] {
  return FULL_EXERCISE_DB.filter(e => e.muscle === muscle);
}

// Проксируем изображения с Google Cloud Storage через наш сервер (для России)
export function getProxiedImageUrl(url: string): string {
  if (!url) return '';
  
  // Проксируем только Google Cloud Storage (заблокирован в России)
  if (url.includes('storage.googleapis.com') || url.includes('storage.cloud.google.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  
  return url;
}

export function getVisualForExercise(exercise: Exercise & { imageUrl?: string | null }): string {
  if (exercise.imageUrl) {
    return getProxiedImageUrl(exercise.imageUrl);
  }
  return MUSCLE_GROUPS[exercise.muscle]?.image || MUSCLE_GROUPS.legs.image;
}
