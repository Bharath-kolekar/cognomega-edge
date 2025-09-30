import { LightningBoltIcon, RocketIcon, MagicWandIcon, CubeIcon, GearIcon, ChatBubbleIcon } from "@radix-ui/react-icons"

export default function FeatureGrid() {
  const features = [
    {
      icon: <LightningBoltIcon className="h-8 w-8 text-primary" />,
      title: "Blazing Fast Generation",
      description: "Generate entire frontend applications in seconds, not weeks. Accelerate your development workflow.",
    },
    {
      icon: <RocketIcon className="h-8 w-8 text-primary" />,
      title: "Seamless Deployment",
      description: "Integrate directly with Vercel for instant deployment of your AI-generated apps.",
    },
    {
      icon: <MagicWandIcon className="h-8 w-8 text-primary" />,
      title: "Intuitive Prompting",
      description: "Describe your vision in natural language, and let our AI bring it to life with stunning accuracy.",
    },
    {
      icon: <CubeIcon className="h-8 w-8 text-primary" />,
      title: "Modular Components",
      description: "Receive well-structured, reusable React components that are easy to customize and extend.",
    },
    {
      icon: <GearIcon className="h-8 w-8 text-primary" />,
      title: "Customizable Themes",
      description: "Tailor the look and feel of your applications with flexible theming options and design tokens.",
    },
    {
      icon: <ChatBubbleIcon className="h-8 w-8 text-primary" />,
      title: "Interactive Previews",
      description: "See your generated code come to life instantly with live, interactive previews.",
    },
  ]

  return (
    <section className="py-20 px-4 md:px-8 lg:px-16 bg-secondary text-secondary-foreground">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-balance">Features That Empower Your Creativity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card text-card-foreground p-6 rounded-lg shadow-md flex flex-col items-center text-center"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-balance">{feature.title}</h3>
              <p className="text-muted-foreground text-pretty">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
