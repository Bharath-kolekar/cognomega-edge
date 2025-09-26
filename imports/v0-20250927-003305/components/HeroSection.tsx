import { ArrowRightIcon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { NeuralBlob } from "@/components/neural-blob"

export default function HeroSection() {
  return (
    <section className="relative w-full h-[70vh] flex items-center justify-center text-center bg-background text-foreground overflow-hidden">
      <NeuralBlob />
      <div className="relative z-10 max-w-3xl px-4 md:px-8">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-tight mb-6 text-balance">
          Supercharge Your Ideas with Cognomega AI
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty">
          Cognomega is your AI-powered app maker, transforming your concepts into stunning frontend applications with
          unparalleled speed and precision.
        </p>
        <Button className="group px-8 py-3 text-lg">
          Start Building Now
          <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </section>
  )
}
