const errorHandler = require("../helper/errorHandler");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const UserModel = require("../models/user.model");
const { decrypt, encrypt } = require("../utils/hashing");
const PlanModel = require("../models/plan.model");

exports.getCustomerAndCardSource = async (params) => {
  try {
    const token = await stripe.tokens.create({
      card: {
        number: params.card.number,
        exp_month: params.card.expMonth,
        exp_year: params.card.expYear,
        cvc: params.card.cvv,
        name: params.card?.name,
      },
    });

    if (!token)
      return {
        status: 500,
        message: "The Stripe Token was not generated correctly",
      };
    let checkCustomer, customerId, cardId;
    const checkUser = await UserModel.findById(params.authUser._id);
    if (checkUser.stripeCustomerId) {
      customerId = decrypt(checkUser.stripeCustomerId);
      checkCustomer = await stripe.customers.retrieve(customerId);
      if (checkCustomer) {
        const allCards = await stripe.customers.listSources(customerId, {
          object: "card",
        });

        if (Array.isArray(allCards.data)) {
          const fingerPrints = [];
          for (let card of allCards.data) {
            fingerPrints.push(card.fingerprint);
            if (card.fingerprint == token.card.fingerprint) cardId = card.id;
          }
          if (!fingerPrints.includes(token?.card?.fingerprint)) {
            const card = await stripe.customers.createSource(customerId, {
              source: token.id,
            });
            cardId = card.id;
          }
        }
      }
    } else {
      checkCustomer = await stripe.customers.create({
        email: params.authUser?.email,
        name: `${params.authUser?.fullname.firstName} ${params.authUser?.fullname?.lastName}`,
        description: "Customer #" + checkUser._id,
        source: token.id,
      });
      customerId = checkCustomer.id;
      await UserModel.findByIdAndUpdate(params.authUser._id, {
        stripeCustomerId: encrypt(checkCustomer.id),
      });
      cardId = token.card.id;
    }

    await stripe.customers.update(customerId, { default_source: cardId });

    return { status: 200, customerId, cardId, checkCustomer, token };
  } catch (error) {
    return { status: 500, message: error.message };
  }
};

exports.getProductDetails = async (params) => {
  let product;
  if (params.stripeProductId) {
    product = await stripe.products.retrieve(params.stripeProductId);
  }

  if (!product) {
    product = await stripe.products.create({
      name: params.name,
      description: params.shortDescription,
      metadata: {
        code: params.code,
      },
    });
  }

  await PlanModel.findOneAndUpdate(
    { code: params.code },
    { stripeProductId: product.id }
  );

  return { status: 200, product, productId: product.id };
};

exports.createSubscription = async (params) => {
  const subscription = await stripe.subscriptions.create({
    customer: params.customerId,
    off_session: true,
    items: [
      {
        price_data: {
          currency: process.env.STRIPE_CURRENCY_CODE,
          product: params.productId,
          unit_amount: parseFloat(params.plan.price) * 100,
          recurring: {
            // interval: params.plan.durationType,
            interval: "day",
          },
        },
      },
    ],
    description: `Create Subscription for ${params.authUser?.email}`,
    metadata: {
      planName: params.plan?.name,
      price: params.plan?.price,
      planCode: params.plan?.code,
      userId: params.authUser._id,
      userName: `${params.authUser?.fullname.firstName} ${params.authUser?.fullname?.lastName}`,
      email: params.authUser?.email,
    },
    payment_settings: {
      payment_method_types: ["card"],
      save_default_payment_method: "on_subscription",
    },
  });

  return subscription;
};
