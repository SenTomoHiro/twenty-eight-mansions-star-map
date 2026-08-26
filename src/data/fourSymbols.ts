import type { FourSymbol } from '../types/xingxiu'

export const FOUR_SYMBOLS: FourSymbol[] = [
  {
    id: 'azure-dragon',
    name: '东方苍龙',
    shortName: '苍龙',
    direction: '东',
    latin: 'AZURE DRAGON OF THE EAST',
    season: '春',
    accent: '#9d6a52',
    statement: '角、亢、氐、房、心、尾、箕连缀为东方七宿。',
  },
  {
    id: 'black-tortoise',
    name: '北方玄武',
    shortName: '玄武',
    direction: '北',
    latin: 'BLACK TORTOISE OF THE NORTH',
    season: '冬',
    accent: '#68787a',
    statement: '斗、牛、女、虚、危、室、壁连缀为北方七宿。',
  },
  {
    id: 'white-tiger',
    name: '西方白虎',
    shortName: '白虎',
    direction: '西',
    latin: 'WHITE TIGER OF THE WEST',
    season: '秋',
    accent: '#a28e73',
    statement: '奎、娄、胃、昴、毕、觜、参连缀为西方七宿。',
  },
  {
    id: 'vermillion-bird',
    name: '南方朱雀',
    shortName: '朱雀',
    direction: '南',
    latin: 'VERMILION BIRD OF THE SOUTH',
    season: '夏',
    accent: '#9b4e43',
    statement: '井、鬼、柳、星、张、翼、轸连缀为南方七宿。',
  },
]

export const FOUR_SYMBOL_BY_ID = Object.fromEntries(
  FOUR_SYMBOLS.map((symbol) => [symbol.id, symbol]),
) as Record<FourSymbol['id'], FourSymbol>
