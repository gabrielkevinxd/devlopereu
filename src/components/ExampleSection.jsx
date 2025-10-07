const ExampleSection = () => {
  return (
    <SectionTemplate 
      title="Título da Seção"
      imageUrl="/caminho/para/imagem.jpg"
      reverse={false}
    >
      <p>
        Seu conteúdo aqui. Este template mantém a consistência visual
        com outras seções do site.
      </p>
      
      <p>
        Você pode adicionar múltiplos parágrafos ou outros elementos
        como children do componente.
      </p>
    </SectionTemplate>
  );
};

export default ExampleSection; 