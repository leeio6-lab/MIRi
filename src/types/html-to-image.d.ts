declare module 'html-to-image' {
  export function toPng(node: HTMLElement, options?: { quality?: number; pixelRatio?: number }): Promise<string>;
  export function toJpeg(node: HTMLElement, options?: { quality?: number; pixelRatio?: number }): Promise<string>;
  export function toBlob(node: HTMLElement, options?: { quality?: number; pixelRatio?: number }): Promise<Blob>;
  export function toSvg(node: HTMLElement, options?: { quality?: number; pixelRatio?: number }): Promise<string>;
}
