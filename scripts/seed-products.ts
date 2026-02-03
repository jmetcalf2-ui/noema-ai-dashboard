// Seed script to create Noema Pro subscription product in Stripe
// Run manually: npx tsx scripts/seed-products.ts

import { getUncachableStripeClient } from '../server/stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  // Check if Pro plan already exists
  const existingProducts = await stripe.products.search({ query: "name:'Noema Pro'" });
  if (existingProducts.data.length > 0) {
    console.log('Noema Pro already exists:', existingProducts.data[0].id);
    return;
  }

  // Create the Pro subscription product
  const product = await stripe.products.create({
    name: 'Noema Pro',
    description: 'Unlimited AI-powered data analysis with advanced features',
    metadata: {
      features: JSON.stringify([
        'Unlimited file uploads',
        'Unlimited AI analyses',
        'Advanced visualizations',
        'Export to PDF & Excel',
        'Priority support',
        'Custom chart builder'
      ])
    }
  });

  console.log('Created product:', product.id);

  // Create monthly price
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 2900, // $29.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { type: 'monthly' }
  });

  console.log('Created monthly price:', monthlyPrice.id, '- $29/month');

  // Create yearly price (with discount)
  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 29000, // $290.00 per year ($24.17/month equivalent - saves $58)
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { type: 'yearly' }
  });

  console.log('Created yearly price:', yearlyPrice.id, '- $290/year');
  console.log('\nProducts seeded successfully!');
}

createProducts().catch(console.error);
