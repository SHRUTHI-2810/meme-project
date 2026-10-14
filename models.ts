/** x / y are percentages (0-100) of the image; size is % of image width. */
export interface Caption { text: string; x: number; y: number; size: number; }
export interface Template { id: string; name: string; url: string; }
export interface Meme {
  id: string; templateId: string; templateUrl: string; title: string;
  captions: Caption[]; likes: number; createdAt: string | null;
}
