/** 换乘线路引用 */
export interface LineRef {
  lineId: string
  lineName: string
  lineColor: string
}

/** 站点 */
export interface Station {
  id: string
  name: string
  nameEn: string
  transfers: LineRef[]
  doorSide: 'left' | 'right' | 'both'
}

/** 线路 */
export interface Line {
  id: string
  name: string
  nameEn: string
  color: string
  stations: Station[]
  isLoop: boolean
  themeId?: string
}

/** 城市线网 */
export interface Network {
  city: string
  cityEn: string
  defaultThemeId: string
  lines: string[]
}
