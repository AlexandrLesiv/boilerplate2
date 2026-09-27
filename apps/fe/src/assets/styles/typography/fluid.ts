import { MAX_SUPPORTED_VIEWPORT, MIN_SUPPORTED_VIEWPORT } from '../responsive/breakpoints';

type FluidTypographyParams = {
  minFontSize: number;
  maxFontSize: number;
  minViewport: number;
  maxViewport: number;
};

const generateFluidTypographyCSS = ({
  minFontSize,
  maxFontSize,
  minViewport,
  maxViewport,
}: FluidTypographyParams): string => {
  const slope = (maxFontSize - minFontSize) / (maxViewport - minViewport);
  const yAxisIntersection = minFontSize - slope * minViewport;
  return `clamp(${minFontSize}px, ${yAxisIntersection}px + ${slope * 100}vw, ${maxFontSize}px)`;
};

export const normalFontSize = generateFluidTypographyCSS({
  minFontSize: 12,
  maxFontSize: 16,
  minViewport: MIN_SUPPORTED_VIEWPORT,
  maxViewport: MAX_SUPPORTED_VIEWPORT,
});
