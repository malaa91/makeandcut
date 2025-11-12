import React from 'react';
import '../styles/Pricing.css';
import { loadStripe } from '@stripe/stripe-js';
function Pricing() {
  const plans = [
    {
      name: "Gratuit",
      price: "0€",
      features: [
        "3 découpages/mois",
        "Vidéos jusqu'à 50MB",
        "Filigrane MakeAndCut",
        "Support basique",
        "Résolution 720p"
      ],
      cta: "Commencer gratuitement",
      type: "free"
    },
    {
      name: "Starter",
      price: "19€",
      period: "/mois",
      features: [
        "50 découpages/mois",
        "Vidéos jusqu'à 500MB",
        "Sans filigrane",
        "Support prioritaire",
        "Résolution 1080p",
        "Téléchargements illimités"
      ],
      cta: "Essayer 7 jours gratuits",
      type: "starter",
      popular: true
    },
    {
      name: "Pro",
      price: "49€",
      period: "/mois",
      features: [
        "Découpages illimités",
        "Vidéos jusqu'à 2GB",
        "Export 4K UHD",
        "Support 24/7",
        "Traitement prioritaire",
        "API d'intégration"
      ],
      cta: "Choisir Pro",
      type: "pro"
    }
  ];

const handlePlanSelect = async (planType) => {
  if (planType === 'free') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Définir les priceId en fonction du plan
    const priceIds = {
      starter: 'price_1SSk8nAsQ5zramhi4fq9NVOc', // Remplace par ton priceId Stripe pour Starter
      pro: 'price_1SSk9iAsQ5zramhiNMSKEXRW'      // Remplace par ton priceId Stripe pour Pro
    };

    const priceId = priceIds[planType];

    try {
      const response = await fetch('https://makeandcut-backend.onrender.com/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const { id } = await response.json();

      // Redirection vers Stripe Checkout
      const stripe = await loadStripe('pk_test_123456789'); // Remplace par ta clé publique Stripe
      const { error } = await stripe.redirectToCheckout({ sessionId: id });

      if (error) {
        console.error('Erreur lors de la redirection vers Stripe:', error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue lors de la redirection vers la page de paiement.');
    }
  }
};

  return (
    <div className="pricing-container" id="pricing">
      <div className="pricing-header">
        <h2>Des tarifs simples et transparents</h2>
        <p>Choisissez l'offre qui correspond à vos besoins de montage vidéo</p>
      </div>

      <div className="pricing-grid">
        {plans.map((plan, index) => (
          <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
            {plan.popular && <div className="popular-badge">⭐ Populaire</div>}
            
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">{plan.price}</span>
                {plan.period && <span className="period">{plan.period}</span>}
              </div>
            </div>

            <ul className="features">
              {plan.features.map((feature, idx) => (
                <li key={idx}>
                  <span className="check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button 
              className={`plan-btn ${plan.popular ? 'popular-btn' : ''} ${plan.type}-btn`}
              onClick={() => handlePlanSelect(plan.type)}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="pricing-footer">
        <p>🔒 Paiement 100% sécurisé • Annulation à tout moment • Satisfaction garantie 30 jours</p>
      </div>
    </div>
  );
}

export default Pricing;