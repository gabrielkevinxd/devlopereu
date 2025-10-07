const SectionTemplate = ({ title, imageUrl, children, reverse = false }) => {
  return (
    <div className="w-full bg-black py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center justify-between gap-12`}>
          {/* Container da Imagem */}
          <div className="w-full md:w-1/2 h-96 rounded-lg overflow-hidden">
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
            />
          </div>
          
          {/* Container do Conteúdo */}
          <div className="w-full md:w-1/2">
            <h2 className="text-4xl font-bold mb-6 text-amber-400">{title}</h2>
            <div className="space-y-4 text-lg leading-relaxed text-white/90">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionTemplate; 