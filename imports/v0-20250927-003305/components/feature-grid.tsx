import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function FeatureGrid() {
  const features = [
    {
      title: "Intuitive Voice-First Development",
      description:
        "Experience the smartest interface for complex application building, leveraging natural voice commands for real-time, effortless code generation.",
      icon: "🎤",
    },
    {
      title: "Seamless Natural Language Processing",
      description:
        "Our advanced AI models intelligently balance speed and intelligence, translating your ideas into code with unparalleled precision.",
      icon: "💬",
    },
    {
      title: "Rapid Full-Stack Application Generation",
      description:
        "Unlock the fastest and most cost-effective solution for complete application development, from dynamic frontends to robust backends.",
      icon: "⚡",
    },
    {
      title: "Uncompromising Enterprise-Grade Security",
      description:
        "Built with the highest enterprise-grade security and compliance standards, ensuring reliability for Fortune 500 deployments.",
      icon: "🔒",
    },
    {
      title: "Intelligent AI-Powered Optimization",
      description:
        "Benefit from intelligent code optimization and performance tuning, driven by cutting-edge machine learning models for peak efficiency.",
      icon: "🧠",
    },
    {
      title: "Infinitely Scalable Cloud-Native Architecture",
      description:
        "Our cloud-native infrastructure is meticulously designed to scale effortlessly, supporting your journey from initial prototype to global production.",
      icon: "📈",
    },
  ]

  return (
    <section className="w-full py-24 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-16">
          <div className="text-center space-y-4 max-w-3xl animate-fade-in">
            <h2 className="text-3xl font-serif font-bold tracking-tight sm:text-4xl md:text-5xl text-balance animate-text-reveal">
              Powering Innovation with Flagship AI Models
            </h2>
            <p
              className="text-base text-muted-foreground md:text-lg text-pretty animate-text-reveal"
              style={{ animationDelay: "0.1s" }}
            >
              Discover our suite of powerful, general-purpose AI models, meticulously engineered for a diverse range of
              real-world tasks, featuring a refreshed knowledge cutoff of June 2024.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-card border-border hover-lift transition-all duration-300 hover:border-primary/30 shadow-sm animate-shimmer group hover:shadow-xl animate-card-pop"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <CardHeader className="space-y-3">
                  <div className="text-xl animate-float group-hover:scale-125 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-foreground text-base font-semibold group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>Text and vision</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
