import { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const FAQSection = styled.section`
  padding: 6rem 1rem;
  background-color: var(--primary);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(0, 255, 229, 0.03) 0%, transparent 70%);
    pointer-events: none;
  }
`;

const Container = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  position: relative;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const Title = styled.h2`
  font-family: 'Anton', sans-serif;
  font-size: 2.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.5rem;
  background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 2rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled.div<{ $isFlipped: boolean }>`
  height: 300px;
  position: relative;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  cursor: pointer;
  transform: ${props => props.$isFlipped ? 'rotateY(180deg)' : 'rotateY(0)'};

  &:hover {
    animation: glow 2s infinite;
  }

  @keyframes glow {
    0% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.2); }
    50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.4); }
    100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.2); }
  }
`;

const CardSide = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const CardFront = styled(CardSide)`
  &::before {
    content: '?';
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 1.5rem;
    color: #FFD700;
    opacity: 0.5;
  }
`;

const CardBack = styled(CardSide)`
  transform: rotateY(180deg);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.3);
    border-radius: 3px;
  }
`;

const Question = styled.h3`
  font-family: 'Anton', sans-serif;
  font-size: 1.1rem;
  color: #FFD700;
  margin: 0;
  padding: 0 1rem;
`;

const Answer = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem;
`;

interface FAQQuestion {
  question: string;
  answer: string;
}

export function FAQ() {
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const { t } = useTranslation();

  const questions = t<FAQQuestion[]>('faq.questions', { returnObjects: true });

  const toggleCard = (index: number) => {
    setFlippedCards(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <FAQSection>
      <Container>
        <Header>
          <Title>{t('faq.title')}</Title>
        </Header>

        <Grid>
          {questions.map((item, index) => (
            <Card 
              key={index}
              $isFlipped={flippedCards.includes(index)}
              onClick={() => toggleCard(index)}
            >
              <CardFront>
                <Question>{item.question}</Question>
              </CardFront>
              <CardBack>
                <Answer>{item.answer}</Answer>
              </CardBack>
            </Card>
          ))}
        </Grid>
      </Container>
    </FAQSection>
  );
} 

