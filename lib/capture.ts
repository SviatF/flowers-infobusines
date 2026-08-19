import capture from './generated-capture.json';

export type CaptureDocument = {
  lang: string;
  title: string;
  description: string;
  styles: string;
  body: string;
};

export function getCaptureDocument(): CaptureDocument {
  return capture;
}
