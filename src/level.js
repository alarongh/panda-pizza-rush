export const FINISH_DISTANCE = 900;
export const VIEW_DISTANCE = 75;
export const OBSTACLES = {
  professor: { label: 'Преподаватель', action: 'dodge' },
  desk: { label: 'Лабораторная', action: 'dodge' },
  assignments: { label: 'Дедлайн', action: 'jump' },
  low: { label: 'Подкат', action: 'slide' },
  coffee: { label: 'Кофе-пауза', action: 'dodge' },
};
/** Authored route: introductions, combinations, final sprint, safe delivery.
 * Every obstacle row has at least one clear lane, so there is no forced loss. */
export function createLevel() {
  const entities = [];
  const add = (type, lane, z) => entities.push({ id: entities.length, type, lane, z, resolved: false });
  const pizzaLine = (lane, start, count = 4) => {
    for (let i = 0; i < count; i++) add('pizza', lane, start + i * 5);
  };
  pizzaLine(1, 14, 5);
  add('professor', 1, 66); pizzaLine(0, 53, 4);
  add('assignments', 0, 106); pizzaLine(0, 111, 3);
  add('low', 0, 151); pizzaLine(0, 157, 3);
  add('desk', 0, 197); pizzaLine(1, 184, 4);
  add('coffee', 1, 240); pizzaLine(2, 227, 4);
  const types = ['assignments', 'professor', 'low', 'desk', 'coffee'];
  let row = 0;
  for (let z = 287; z < 852; z += z < 480 ? 34 : z < 690 ? 30 : 27) {
    const lane = (row * 2 + 1) % 3;
    const type = types[row % types.length];
    add(type, lane, z);
    if (z > 460 && row % 3 !== 0) add(types[(row + 2) % types.length], (lane + 1) % 3, z);
    const safeLane = z > 460 && row % 3 !== 0 ? (lane + 2) % 3 : (lane + 1) % 3;
    pizzaLine(safeLane, z - 8, 3);
    row++;
  }
  pizzaLine(1, 866, 5);
  return entities.sort((a, b) => a.z - b.z);
}
export function hintAt(distance) {
  if (distance < 38) return '🍕 Собирай пиццу. Свайп или стрелки!';
  if (distance < 75) return '↔ Преподаватель на пути! Меняй полосу';
  if (distance > 85 && distance < 115) return '↑ Стопка заданий? Перепрыгни!';
  if (distance > 132 && distance < 162) return '↓ Под баннером нужен подкат';
  if (distance > 854) return '⚑ Студик впереди. Пицца почти дома!';
  return '';
}
