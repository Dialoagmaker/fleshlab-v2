import { Bot, Camera, Film, Image, Layers, Sparkles } from "lucide-react";

const modules = [
  { icon: Film, title: "Scene Detector", text: "Semantic segmentation, shot boundaries, movement, stability." },
  { icon: Camera, title: "Visual Detectors", text: "Face, pose, eye contact, smile, head angle, body visibility." },
  { icon: Image, title: "Asset Rankers", text: "Screenshots, thumbnails, GIF loops, covers, vertical shorts." },
  { icon: Sparkles, title: "Metadata Generator", text: "Titles, tags, SEO copy, PPV text, social descriptions." },
  { icon: Layers, title: "Cover Generator", text: "Behind the Scenes, Premium, Netflix Style, Summer Campaign." },
  { icon: Bot, title: "Model Adapters", text: "ONNX, TensorRT, PyTorch, llama.cpp, CUDA, DirectML, Metal." },
];

export default function PipelineOverview() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {modules.map(item => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-foreground">{item.title}</h3>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{item.text}</p>
          </div>
        );
      })}
    </div>
  );
}