import heroBg from '@/assets/hero-bg.jpg';

export default function HeroSection() {
  return (
    <section className="relative h-[340px] md:h-[400px] overflow-hidden">
      <img
        src={heroBg}
        alt="Cuisine"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 gradient-hero" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-3 drop-shadow-lg">
          Les Tambouilles de Bulle & Luigi
        </h1>
        <p className="font-body text-primary-foreground/90 text-lg md:text-xl max-w-lg">
          Miam !
        </p>
      </div>
    </section>
  );
}
