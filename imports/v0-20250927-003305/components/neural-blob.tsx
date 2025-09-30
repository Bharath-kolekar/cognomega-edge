const NeuralBlob = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
        {/* Core glowing blob */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 opacity-70 blur-2xl animate-pulse-slow"></div>

        {/* Neural network lines */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-px bg-accent rounded-full animate-neural-line opacity-0"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          ></div>
        ))}

        {/* Central glowing core */}
        <div className="absolute inset-1/4 rounded-full bg-primary/80 blur-xl opacity-50 animate-pulse-fast"></div>
      </div>
    </div>
  )
}

export { NeuralBlob }
export default NeuralBlob
