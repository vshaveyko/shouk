/* eslint-disable no-console */
/**
 * Shouks database seed.
 * Run: npm run db:seed
 *
 * Wipes and re-creates a small but realistic demo dataset:
 *   • 4 test users (owner/member/reviewer/applicant)
 *   • 2 marketplaces (Ferrari Frenzy, Gooners United) with schemas
 *   • Memberships, listings, a pending application, and sample notifications.
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PW_HASH_ROUNDS = 12;
const SEED_PASSWORD = "Test123!@#";

async function main() {
  console.log("• Clearing existing data…");
  await clearData();

  const now = new Date();
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, PW_HASH_ROUNDS);

  // ── Users ────────────────────────────────────────────────────────────
  console.log("• Creating users…");

  const owner = await prisma.user.create({
    data: {
      email: "owner@shouks.test",
      emailVerified: now,
      passwordHash,
      name: "Marcus Owner",
      displayName: "Marcus Owner",
      image: "https://i.pravatar.cc/200?img=12",
      bio: "Air-cooled Ferrari obsessive. Host of Ferrari Frenzy.",
      defaultRole: "OWNER",
      verifiedAccounts: {
        create: [
          { provider: "GOOGLE", handle: "marcus@gmail.com", profileUrl: "https://google.com/marcus" },
          { provider: "FACEBOOK", handle: "marcus.owner", profileUrl: "https://facebook.com/marcus.owner" },
          { provider: "INSTAGRAM", handle: "@marcus.drives", profileUrl: "https://instagram.com/marcus.drives" },
        ],
      },
    },
  });

  const member = await prisma.user.create({
    data: {
      email: "member@shouks.test",
      emailVerified: now,
      passwordHash,
      name: "Sasha Member",
      displayName: "Sasha Member",
      image: "https://i.pravatar.cc/200?img=5",
      bio: "Collector. Daily-drives a 348.",
      defaultRole: "MEMBER",
      phoneNumber: "+15555550101",
      phoneVerified: true,
      verifiedAccounts: {
        create: [
          { provider: "GOOGLE", handle: "sasha@gmail.com", profileUrl: "https://google.com/sasha" },
          { provider: "PHONE", handle: "+15555550101" },
        ],
      },
    },
  });

  const reviewer = await prisma.user.create({
    data: {
      email: "reviewer@shouks.test",
      emailVerified: now,
      passwordHash,
      name: "Rita Reviewer",
      displayName: "Rita Reviewer",
      image: "https://i.pravatar.cc/200?img=32",
      bio: "Admin for Ferrari Frenzy — triage + moderation.",
      defaultRole: "MEMBER",
      verifiedAccounts: {
        create: [
          { provider: "GOOGLE", handle: "rita@gmail.com", profileUrl: "https://google.com/rita" },
          { provider: "FACEBOOK", handle: "rita.reviewer", profileUrl: "https://facebook.com/rita.reviewer" },
        ],
      },
    },
  });

  const applicant = await prisma.user.create({
    data: {
      email: "applicant@shouks.test",
      emailVerified: now,
      passwordHash,
      name: "Jane Applicant",
      displayName: "Jane Applicant",
      image: "https://i.pravatar.cc/200?img=47",
      bio: "Just got my first 308. Looking for a tribe.",
      defaultRole: "MEMBER",
      verifiedAccounts: {
        create: [
          { provider: "GOOGLE", handle: "jane@gmail.com", profileUrl: "https://google.com/jane" },
        ],
      },
    },
  });

  // ── Marketplaces ─────────────────────────────────────────────────────
  console.log("• Creating marketplaces…");

  const ferrari = await prisma.marketplace.create({
    data: {
      slug: "ferrari-frenzy",
      name: "Ferrari Frenzy",
      tagline: "A home for air-cooled Ferraris and the people who love them",
      description:
        "Vetted community for serious enthusiasts. We're here to trade, talk, and hunt down the hard-to-find cars you actually want. Applications are reviewed by a human — no bots, no flippers.",
      category: "Vehicles",
      primaryColor: "#b8334d",
      coverImageUrl: "https://picsum.photos/seed/ferrari-cover/1600/400",
      entryMethod: "APPLICATION",
      requiredVerifications: ["GOOGLE", "FACEBOOK"],
      auctionsEnabled: true,
      antiSnipe: true,
      moderationRequired: false,
      status: "ACTIVE",
      publishedAt: now,
      ownerId: owner.id,
      schemaFields: {
        create: [
          {
            order: 0,
            name: "title",
            label: "Title",
            type: "SHORT_TEXT",
            required: true,
            cardPreview: true,
          },
          {
            order: 1,
            name: "price",
            label: "Price",
            type: "CURRENCY",
            required: true,
            cardPreview: true,
          },
          {
            order: 2,
            name: "year",
            label: "Year",
            type: "NUMBER",
            required: true,
          },
          {
            order: 3,
            name: "model",
            label: "Model",
            type: "SHORT_TEXT",
            required: true,
          },
          {
            order: 4,
            name: "condition",
            label: "Condition",
            type: "SELECT",
            required: true,
            options: ["Concours", "Excellent", "Good", "Project"],
          },
          {
            order: 5,
            name: "mileage",
            label: "Mileage",
            type: "NUMBER",
            required: false,
          },
          {
            order: 6,
            name: "description",
            label: "Description",
            type: "LONG_TEXT",
            required: false,
          },
          {
            order: 7,
            name: "images",
            label: "Images",
            type: "IMAGE",
            required: true,
            minImages: 1,
            maxImages: 10,
            cardPreview: true,
          },
        ],
      },
      applicationQuestions: {
        create: [
          {
            order: 0,
            label: "Why do you want to join?",
            type: "LONG_TEXT",
            required: true,
          },
          {
            order: 1,
            label: "How did you hear about us?",
            type: "SHORT_TEXT",
            required: false,
          },
        ],
      },
    },
  });

  const gooners = await prisma.marketplace.create({
    data: {
      slug: "gooners-united",
      name: "Gooners United",
      tagline: "Arsenal memorabilia & match-worn kit",
      description: "Invite-only club for Arsenal collectors.",
      category: "Memorabilia",
      primaryColor: "#ef3340",
      coverImageUrl: "https://picsum.photos/seed/gooners-cover/1600/400",
      entryMethod: "INVITE",
      requiredVerifications: ["GOOGLE"],
      auctionsEnabled: false,
      antiSnipe: true,
      moderationRequired: false,
      status: "ACTIVE",
      publishedAt: now,
      ownerId: owner.id,
      schemaFields: {
        create: [
          {
            order: 0,
            name: "title",
            label: "Title",
            type: "SHORT_TEXT",
            required: true,
            cardPreview: true,
          },
          {
            order: 1,
            name: "price",
            label: "Price",
            type: "CURRENCY",
            required: true,
            cardPreview: true,
          },
          {
            order: 2,
            name: "era",
            label: "Era",
            type: "SELECT",
            required: false,
            options: ["1990s", "2000s", "2010s", "Current"],
          },
          {
            order: 3,
            name: "images",
            label: "Images",
            type: "IMAGE",
            required: true,
            minImages: 1,
            maxImages: 8,
            cardPreview: true,
          },
        ],
      },
    },
  });

  // ── Memberships ─────────────────────────────────────────────────────
  console.log("• Creating memberships…");

  await prisma.membership.createMany({
    data: [
      // Owner owns both; add explicit OWNER membership rows for completeness.
      { userId: owner.id, marketplaceId: ferrari.id, role: "OWNER", status: "ACTIVE" },
      { userId: owner.id, marketplaceId: gooners.id, role: "OWNER", status: "ACTIVE" },

      // Reviewer is admin of Ferrari Frenzy.
      { userId: reviewer.id, marketplaceId: ferrari.id, role: "ADMIN", status: "ACTIVE" },

      // Sasha is an active member of both.
      { userId: member.id, marketplaceId: ferrari.id, role: "MEMBER", status: "ACTIVE" },
      { userId: member.id, marketplaceId: gooners.id, role: "MEMBER", status: "ACTIVE" },
    ],
  });

  // ── Listings ────────────────────────────────────────────────────────
  console.log("• Creating listings…");

  const oneDay = 1000 * 60 * 60 * 24;
  const inTwoDays = new Date(now.getTime() + oneDay * 2);

  await prisma.listing.createMany({
    data: [
      // Ferrari Frenzy fixed-price
      {
        marketplaceId: ferrari.id,
        sellerId: owner.id,
        title: "1995 Ferrari F355 Spider — $175,000",
        type: "FIXED",
        status: "ACTIVE",
        priceCents: 175_000_00,
        currency: "USD",
        description:
          "One-owner, 31k miles, recent major service, Rosso Corsa over tan. Gated 6-speed. Books, tools, and records present.",
        schemaValues: {
          title: "1995 F355 Spider",
          price: 175_000_00,
          year: 1995,
          model: "F355 Spider",
          condition: "Excellent",
          mileage: 31_412,
        },
        images: [
          "https://picsum.photos/seed/ferrari-1-a/800/600",
          "https://picsum.photos/seed/ferrari-1-b/800/600",
          "https://picsum.photos/seed/ferrari-1-c/800/600",
        ],
        publishedAt: new Date(now.getTime() - oneDay * 3),
      },
      {
        marketplaceId: ferrari.id,
        sellerId: member.id,
        title: "1992 Ferrari 512 TR — $225,000",
        type: "FIXED",
        status: "ACTIVE",
        priceCents: 225_000_00,
        currency: "USD",
        description:
          "Beautifully preserved 512 TR with recent engine-out service. Nero over Crema. 22,108 miles.",
        schemaValues: {
          title: "1992 512 TR",
          price: 225_000_00,
          year: 1992,
          model: "512 TR",
          condition: "Concours",
          mileage: 22_108,
        },
        images: [
          "https://picsum.photos/seed/ferrari-2-a/800/600",
          "https://picsum.photos/seed/ferrari-2-b/800/600",
        ],
        publishedAt: new Date(now.getTime() - oneDay * 1),
      },
      // Ferrari Frenzy auction (running ~2 days)
      {
        marketplaceId: ferrari.id,
        sellerId: owner.id,
        title: "1987 Ferrari Testarossa Monospecchio — Auction",
        type: "AUCTION",
        status: "ACTIVE",
        priceCents: null,
        currency: "USD",
        description:
          "Monospecchio Testarossa, single mirror, flying-mirror. Excellent original condition. Reserve set; 2-day auction.",
        schemaValues: {
          title: "1987 Testarossa Monospecchio",
          year: 1987,
          model: "Testarossa",
          condition: "Excellent",
          mileage: 38_412,
        },
        images: [
          "https://picsum.photos/seed/ferrari-auction-a/800/600",
          "https://picsum.photos/seed/ferrari-auction-b/800/600",
        ],
        auctionStartCents: 140_000_00,
        auctionReserveCents: 170_000_00,
        auctionMinIncrementCents: 500_00,
        auctionStartsAt: now,
        auctionEndsAt: inTwoDays,
        publishedAt: now,
      },
      // Ferrari Frenzy ISO
      {
        marketplaceId: ferrari.id,
        sellerId: applicant.id, // Jane, not yet a member of Ferrari — seed as general site ISO
        title: "ISO: Clean 308 GT4 — up to $85k",
        type: "ISO",
        status: "ACTIVE",
        priceCents: 85_000_00,
        currency: "USD",
        description:
          "Looking for a clean 308 GT4, any color but prefer Giallo or Fly Yellow, up to 50k miles, full history.",
        schemaValues: {
          title: "ISO: 308 GT4",
          budgetMax: 85_000_00,
          model: "308 GT4",
          notes: "Any color, prefer Giallo or Fly Yellow. Up to 50k miles.",
        },
        images: [],
        publishedAt: new Date(now.getTime() - oneDay * 2),
      },
      // Gooners United fixed-price
      {
        marketplaceId: gooners.id,
        sellerId: owner.id,
        title: "Arsenal 1998 Double-Winning Home Shirt — Signed",
        type: "FIXED",
        status: "ACTIVE",
        priceCents: 1_450_00,
        currency: "USD",
        description:
          "Home shirt from the 97/98 double-winning season. Signed by Bergkamp. Mint condition, never worn.",
        schemaValues: {
          title: "Arsenal 1998 Home Shirt — Signed",
          price: 1_450_00,
          era: "1990s",
        },
        images: [
          "https://picsum.photos/seed/gooners-1-a/800/600",
          "https://picsum.photos/seed/gooners-1-b/800/600",
        ],
        publishedAt: new Date(now.getTime() - oneDay * 4),
      },
      {
        marketplaceId: gooners.id,
        sellerId: member.id,
        title: "Vintage Arsenal Scarf — 1980s Highbury",
        type: "FIXED",
        status: "ACTIVE",
        priceCents: 125_00,
        currency: "USD",
        description: "Woven scarf from the Highbury era. Some fading but excellent shape.",
        schemaValues: {
          title: "Vintage Arsenal Scarf",
          price: 125_00,
          era: "1990s",
        },
        images: ["https://picsum.photos/seed/gooners-2-a/800/600"],
        publishedAt: new Date(now.getTime() - oneDay * 6),
      },
    ],
  });

  // ── Pending application (Jane → Ferrari Frenzy) ─────────────────────
  console.log("• Creating application(s)…");

  // Historical withdrawn/rejected attempt (to show there can be multiple records
  // without violating a DB-unique rule — the schema does not unique-constraint
  // applications, so this is safe). Then one current PENDING application.
  await prisma.application.create({
    data: {
      userId: applicant.id,
      marketplaceId: ferrari.id,
      status: "NEEDS_INFO",
      reviewerNote: "Please add photos of the 308 and proof of ownership.",
      answers: {
        "Why do you want to join?":
          "I just bought a 308 and want a place to talk about it with people who get it.",
        "How did you hear about us?": "Google search.",
      },
      createdAt: new Date(now.getTime() - oneDay * 5),
    },
  });

  await prisma.application.create({
    data: {
      userId: applicant.id,
      marketplaceId: ferrari.id,
      status: "PENDING",
      answers: {
        "Why do you want to join?":
          "I just bought my first 308 GT4 and want to meet serious collectors, trade parts, and eventually find a 512 TR. I've been lurking in forums for years.",
        "How did you hear about us?": "A friend in the 308 Register mentioned Shouks.",
      },
      createdAt: new Date(now.getTime() - oneDay * 1),
    },
  });

  // ── Notifications ───────────────────────────────────────────────────
  console.log("• Creating notifications…");

  const isoListing = await prisma.listing.findFirst({
    where: { marketplaceId: ferrari.id, type: "ISO" },
  });
  const auctionListing = await prisma.listing.findFirst({
    where: { marketplaceId: ferrari.id, type: "AUCTION" },
  });
  const firstFixedListing = await prisma.listing.findFirst({
    where: { marketplaceId: ferrari.id, type: "FIXED" },
    orderBy: { createdAt: "desc" },
  });

  const ninetyMinAgo = new Date(now.getTime() - 1000 * 60 * 90);
  const twoHoursAgo = new Date(now.getTime() - 1000 * 60 * 60 * 2);
  const yesterday = new Date(now.getTime() - oneDay);
  const fourDaysAgo = new Date(now.getTime() - oneDay * 4);

  await prisma.notification.createMany({
    data: [
      // Marcus (owner)
      {
        userId: owner.id,
        marketplaceId: ferrari.id,
        kind: "APPLICATION_SUBMITTED",
        title: "New application from Jane Applicant",
        preview: "Wants to join Ferrari Frenzy. Has 1 verified identity (Google).",
        deeplink: `/owner/${ferrari.slug}/applications`,
        createdAt: ninetyMinAgo,
      },
      {
        userId: owner.id,
        marketplaceId: ferrari.id,
        kind: "BID_OUTBID",
        title: "New bid on your 1987 Testarossa Monospecchio",
        preview: "Nadia V. placed a bid of $152,000.",
        deeplink: auctionListing ? `/l/${auctionListing.id}` : "/",
        createdAt: twoHoursAgo,
      },
      {
        userId: owner.id,
        kind: "SYSTEM",
        title: "Welcome to Shouks",
        preview: "Your two marketplaces are live. Invite your first members.",
        deeplink: "/home",
        readAt: fourDaysAgo,
        createdAt: fourDaysAgo,
      },
      // Sasha (member)
      {
        userId: member.id,
        marketplaceId: ferrari.id,
        kind: "ISO_MATCH",
        title: "Marco C. posted a listing matching your ISO",
        preview: "1987 Testarossa · Nero · $184,000 matches your wanted ad.",
        deeplink: auctionListing ? `/l/${auctionListing.id}` : "/",
        createdAt: new Date(now.getTime() - 1000 * 60 * 14),
      },
      {
        userId: member.id,
        marketplaceId: ferrari.id,
        kind: "MENTION",
        title: "Marcus mentioned you in a comment",
        preview: "@sasha have you seen this one? Right up your alley.",
        deeplink: firstFixedListing ? `/l/${firstFixedListing.id}` : "/",
        createdAt: yesterday,
      },
      {
        userId: member.id,
        marketplaceId: gooners.id,
        kind: "NEW_LISTING_MATCH",
        title: "New Arsenal listing in Gooners United",
        preview: "Match-worn 2003/04 Invincibles shirt just went live.",
        deeplink: `/m/${gooners.slug}`,
        createdAt: new Date(now.getTime() - oneDay * 2),
      },
      // Reviewer
      {
        userId: reviewer.id,
        marketplaceId: ferrari.id,
        kind: "APPLICATION_SUBMITTED",
        title: "New application awaiting review",
        preview: "Jane Applicant submitted an application to Ferrari Frenzy.",
        deeplink: `/owner/${ferrari.slug}/applications`,
        createdAt: ninetyMinAgo,
      },
      {
        userId: reviewer.id,
        marketplaceId: ferrari.id,
        kind: "LISTING_FLAGGED",
        title: "A listing was reported",
        preview: "1 new report: Misleading description.",
        deeplink: `/owner/${ferrari.slug}/moderation`,
        createdAt: yesterday,
      },
      // Jane (applicant)
      {
        userId: applicant.id,
        marketplaceId: ferrari.id,
        kind: "APPLICATION_NEEDS_INFO",
        title: "Ferrari Frenzy needs more info on your application",
        preview: "Add photos of your 308 and proof of ownership.",
        deeplink: `/apply/${ferrari.slug}`,
        createdAt: new Date(now.getTime() - oneDay * 4),
      },
      {
        userId: applicant.id,
        kind: "SYSTEM",
        title: "Welcome to Shouks",
        preview: "Start by exploring public marketplaces.",
        deeplink: "/explore",
        readAt: fourDaysAgo,
        createdAt: fourDaysAgo,
      },
      {
        userId: applicant.id,
        marketplaceId: ferrari.id,
        kind: "ISO_MATCH",
        title: "Possible match for your 308 GT4 hunt",
        preview: "Sasha M. posted a 308 GTS — not a GT4 but close.",
        deeplink: isoListing ? `/l/${isoListing.id}` : "/",
        createdAt: new Date(now.getTime() - oneDay * 3),
      },
    ],
  });

  console.log("✓ Seed complete.");
  console.log("  Users:");
  console.log("    owner@shouks.test / Test123!@#  (Marcus Owner — OWNER)");
  console.log("    member@shouks.test / Test123!@#  (Sasha Member — MEMBER)");
  console.log("    reviewer@shouks.test / Test123!@#  (Rita Reviewer — Ferrari admin)");
  console.log("    applicant@shouks.test / Test123!@#  (Jane Applicant — MEMBER)");
  console.log("  Marketplaces: ferrari-frenzy, gooners-united");
}

async function clearData() {
  // Delete in FK-safe order.
  await prisma.notification.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.moderationAction.deleteMany();
  await prisma.report.deleteMany();
  await prisma.listingSave.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.application.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.applicationQuestion.deleteMany();
  await prisma.schemaField.deleteMany();
  await prisma.marketplace.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.verifiedAccount.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
