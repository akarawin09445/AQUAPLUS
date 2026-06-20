declare module "react-simple-maps" {
  import { ReactNode, CSSProperties, MouseEvent } from "react"

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: Record<string, unknown>
    style?: CSSProperties
    children?: ReactNode
    [key: string]: unknown
  }
  export function ComposableMap(props: ComposableMapProps): JSX.Element

  export interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    minZoom?: number
    maxZoom?: number
    children?: ReactNode
    [key: string]: unknown
  }
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element

  export interface GeographyObject {
    rsmKey: string
    bbox?: number[]
    properties?: Record<string, unknown>
    [key: string]: unknown
  }

  export interface GeographiesProps {
    geography: string | object
    children: (props: { geographies: GeographyObject[] }) => ReactNode
  }
  export function Geographies(props: GeographiesProps): JSX.Element

  export interface GeographyProps {
    geography: GeographyObject
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: CSSProperties
      hover?: CSSProperties
      pressed?: CSSProperties
    }
    [key: string]: unknown
  }
  export function Geography(props: GeographyProps): JSX.Element

  export interface MarkerProps {
    coordinates: [number, number]
    onClick?: (event: MouseEvent<SVGElement>) => void
    style?: CSSProperties
    children?: ReactNode
    [key: string]: unknown
  }
  export function Marker(props: MarkerProps): JSX.Element

  export interface AnnotationProps {
    subject: [number, number]
    dx?: number
    dy?: number
    connectorProps?: Record<string, unknown>
    children?: ReactNode
    [key: string]: unknown
  }
  export function Annotation(props: AnnotationProps): JSX.Element
}
