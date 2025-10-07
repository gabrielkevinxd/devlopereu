import styled from 'styled-components';
import { 
  Brain,
  Users,
  BarChart3,
  ArrowUpRight,
  Combine,
  Rocket
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AdvantagesSection = styled.section`
  padding: 6rem 1rem;
  background-color: var(--primary);
  color: white;
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

const SectionTitle = styled.h2`
  font-family: 'Anton', sans-serif;
  color: var(--accent);
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
`;

const SectionDescription = styled.h3`
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

const SubDescription = styled.p`
  font-family: 'Montserrat', sans-serif;
  color: #94A3B8;
  font-size: 1.125rem;
  max-width: 48rem;
  margin: 0 auto;
  line-height: 1.8;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 2.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled.div`
  text-align: center;
  padding: 2rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const IconWrapper = styled.div`
  width: 4rem;
  height: 4rem;
  background: rgba(var(--accent-rgb), 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  transition: all 0.3s ease;
  
  svg {
    color: var(--accent);
    width: 2rem;
    height: 2rem;
  }

  ${Card}:hover & {
    background: var(--accent);
    
    svg {
      color: var(--primary);
    }
  }
`;

const CardTitle = styled.h4`
  font-family: 'Anton', sans-serif;
  font-size: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  background: linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.9) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const CardDescription = styled.p`
  font-family: 'Montserrat', sans-serif;
  color: var(--gray-light);
  font-size: 1rem;
  line-height: 1.8;
`;

const advantages = [
  {
    icon: <Brain />,
    key: 'efficiency'
  },
  {
    icon: <Users />,
    key: 'experience'
  },
  {
    icon: <BarChart3 />,
    key: 'insights'
  },
  {
    icon: <ArrowUpRight />,
    key: 'scalability'
  },
  {
    icon: <Combine />,
    key: 'integration'
  },
  {
    icon: <Rocket />,
    key: 'growth'
  }
];

export function Advantages() {
  const { t } = useTranslation();

  return (
    <AdvantagesSection>
      <Container>
        <Header>
          <SectionTitle>{t('advantages.title')}</SectionTitle>
          <SectionDescription>{t('advantages.subtitle')}</SectionDescription>
          <SubDescription>
            {t('advantages.description')}
          </SubDescription>
        </Header>

        <Grid>
          {advantages.map((advantage, index) => (
            <Card key={index}>
              <IconWrapper>
                {advantage.icon}
              </IconWrapper>
              <CardTitle>{t(`advantages.items.${advantage.key}.title`)}</CardTitle>
              <CardDescription>{t(`advantages.items.${advantage.key}.description`)}</CardDescription>
            </Card>
          ))}
        </Grid>
      </Container>
    </AdvantagesSection>
  );
} 