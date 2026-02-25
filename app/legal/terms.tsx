import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Header } from '@/components/layout';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Terms of Service"
        leftIcon={<Text style={styles.backArrow}>{'<'}</Text>}
        onLeftPress={() => router.back()}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: 25 February 2026</Text>

        {/* Introduction */}
        <Text style={styles.paragraph}>
          Welcome to FreshLocal. These Terms of Service ("Terms") govern your use of the FreshLocal
          mobile application and website (the "Platform"), operated by FreshLocal Ltd, a company
          registered in England and Wales.
        </Text>
        <Text style={styles.paragraph}>
          By creating an account or using FreshLocal, you agree to these Terms. If you do not agree,
          please do not use the Platform.
        </Text>

        {/* Section 1 */}
        <Text style={styles.sectionHeading}>1. About FreshLocal</Text>
        <Text style={styles.paragraph}>
          FreshLocal is a hyperlocal marketplace that connects customers with local halal food
          vendors, including home kitchens, shops, and pop-up food businesses. We facilitate the
          discovery, ordering, and payment process, but we do not prepare, handle, or deliver food
          ourselves. Each vendor is an independent business responsible for their own food
          preparation, quality, and compliance with applicable laws.
        </Text>

        {/* Section 2 */}
        <Text style={styles.sectionHeading}>2. Eligibility</Text>
        <Text style={styles.paragraph}>To use FreshLocal, you must:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            {'\u2022'} Be at least 18 years of age.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Be a resident of the United Kingdom.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Have the legal capacity to enter into a binding agreement.
          </Text>
        </View>
        <Text style={styles.paragraph}>
          By creating an account, you confirm that you meet these requirements.
        </Text>

        {/* Section 3 */}
        <Text style={styles.sectionHeading}>3. Account Registration and Responsibilities</Text>

        <Text style={styles.subHeading}>Creating an Account</Text>
        <Text style={styles.paragraph}>
          You may register using your email address or phone number. You must provide accurate,
          current, and complete information during registration and keep your account details up to
          date.
        </Text>

        <Text style={styles.subHeading}>Account Security</Text>
        <Text style={styles.paragraph}>
          You are responsible for maintaining the confidentiality of your login credentials. You must
          notify us immediately at support@freshlocal.co.uk if you suspect any unauthorised access to
          your account.
        </Text>

        <Text style={styles.subHeading}>One Account Per Person</Text>
        <Text style={styles.paragraph}>
          Each individual may hold only one customer account. Vendors must apply for a separate vendor
          account, which is subject to the Vendor Terms of Service.
        </Text>

        {/* Section 4 */}
        <Text style={styles.sectionHeading}>4. How Ordering Works</Text>

        <Text style={styles.subHeading}>Browsing and Ordering</Text>
        <Text style={styles.paragraph}>
          You can browse vendor listings, view menus, and place orders through the Platform. When you
          place an order, you are making an offer to purchase from the vendor. The order is confirmed
          once the vendor accepts it.
        </Text>

        <Text style={styles.subHeading}>Pricing</Text>
        <Text style={styles.paragraph}>
          All prices displayed on the Platform are set by vendors and are shown in British Pounds
          (GBP) inclusive of VAT where applicable. A platform service fee of 5% is added to the
          customer's order total at checkout.
        </Text>

        <Text style={styles.subHeading}>Commission</Text>
        <Text style={styles.paragraph}>
          FreshLocal charges vendors a commission of 12% on the total value of each completed order.
          This commission is deducted from the vendor's payout and does not affect the price you pay
          as a customer.
        </Text>

        <Text style={styles.subHeading}>Order Accuracy</Text>
        <Text style={styles.paragraph}>
          Please review your order carefully before submitting. Once a vendor has accepted your order,
          changes may not be possible.
        </Text>

        {/* Section 5 */}
        <Text style={styles.sectionHeading}>5. Payment Processing</Text>
        <Text style={styles.paragraph}>
          All payments are processed securely through Stripe, our third-party payment provider.
          FreshLocal does not store your full card details. By making a payment, you also agree to
          Stripe's terms of service and privacy policy.
        </Text>
        <Text style={styles.paragraph}>
          Accepted payment methods include debit cards, credit cards, Apple Pay, and Google Pay.
        </Text>

        {/* Section 6 */}
        <Text style={styles.sectionHeading}>6. Food Safety</Text>

        <Text style={styles.subHeading}>Vendor Responsibility</Text>
        <Text style={styles.paragraph}>
          Vendors listed on FreshLocal are solely responsible for compliance with the Food Safety Act
          1990, the Food Hygiene Regulations 2013, Food Standards Agency requirements, accurate
          allergen information and labelling in accordance with Natasha's Law, and obtaining and
          maintaining a satisfactory Food Hygiene Rating.
        </Text>

        <Text style={styles.subHeading}>Platform Role</Text>
        <Text style={styles.paragraph}>
          FreshLocal requires vendors to confirm compliance with food safety regulations as a
          condition of listing. However, we do not inspect vendor premises and cannot guarantee the
          safety, quality, or allergen accuracy of any food sold through the Platform.
        </Text>

        <Text style={styles.subHeading}>Allergen Information</Text>
        <Text style={styles.paragraph}>
          Allergen information is provided by vendors. If you have food allergies or dietary
          requirements, we strongly recommend contacting the vendor directly before placing an order.
        </Text>

        {/* Section 7 */}
        <Text style={styles.sectionHeading}>7. Cancellation and Refunds</Text>

        <Text style={styles.subHeading}>Cancellation by You</Text>
        <Text style={styles.paragraph}>
          You may cancel an order free of charge if the vendor has not yet started preparing it. Once
          preparation has begun, cancellation may not be possible.
        </Text>

        <Text style={styles.subHeading}>Cancellation by Vendor</Text>
        <Text style={styles.paragraph}>
          Vendors may cancel an order if they are unable to fulfil it (for example, due to ingredient
          unavailability). In this case, you will receive a full refund.
        </Text>

        <Text style={styles.subHeading}>Refund Policy</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            {'\u2022'} Full refund: If the vendor cancels, or if you cancel before preparation
            begins.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Partial or full refund: If the order is materially different from what was
            described, arrives in an unacceptable condition, or is significantly late. Refund
            decisions are made at FreshLocal's reasonable discretion.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} No refund: For orders that have been collected or delivered and consumed, or
            where the complaint is based solely on personal taste preference.
          </Text>
        </View>
        <Text style={styles.paragraph}>
          Refunds are processed back to your original payment method and typically take 5 to 10
          business days to appear on your statement.
        </Text>

        <Text style={styles.subHeading}>Disputes</Text>
        <Text style={styles.paragraph}>
          If you are not satisfied with a refund decision, you may contact us at
          support@freshlocal.co.uk. We will review the dispute and respond within 5 business days.
        </Text>

        {/* Section 8 */}
        <Text style={styles.sectionHeading}>8. Acceptable Use</Text>
        <Text style={styles.paragraph}>You agree not to:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            {'\u2022'} Use the Platform for any unlawful purpose.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Submit false reviews, ratings, or information.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Harass, abuse, or threaten vendors or other users.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Attempt to circumvent the Platform to transact directly with vendors.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Reverse-engineer, copy, or interfere with the Platform's technology.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Create multiple accounts or share account access.
          </Text>
        </View>
        <Text style={styles.paragraph}>
          We reserve the right to suspend or terminate accounts that breach these rules.
        </Text>

        {/* Section 9 */}
        <Text style={styles.sectionHeading}>9. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          All content on the Platform, including the FreshLocal name, logo, design, and software, is
          owned by or licensed to FreshLocal Ltd and is protected by intellectual property laws.
        </Text>
        <Text style={styles.paragraph}>
          Vendors retain ownership of their own product images and descriptions but grant FreshLocal a
          non-exclusive, royalty-free licence to display this content on the Platform for the purpose
          of facilitating orders.
        </Text>
        <Text style={styles.paragraph}>
          You may not reproduce, distribute, or create derivative works from any Platform content
          without our prior written consent.
        </Text>

        {/* Section 10 */}
        <Text style={styles.sectionHeading}>10. Limitation of Liability</Text>

        <Text style={styles.subHeading}>Platform Provision</Text>
        <Text style={styles.paragraph}>
          FreshLocal is provided on an "as is" and "as available" basis. While we strive to maintain a
          reliable service, we do not guarantee uninterrupted access.
        </Text>

        <Text style={styles.subHeading}>Food-Related Liability</Text>
        <Text style={styles.paragraph}>
          FreshLocal acts as a marketplace and is not the producer or seller of food. To the fullest
          extent permitted by law, we are not liable for any illness, allergic reaction, injury, or
          loss arising from the consumption of food ordered through the Platform.
        </Text>

        <Text style={styles.subHeading}>Cap on Liability</Text>
        <Text style={styles.paragraph}>
          To the extent permitted by applicable law, FreshLocal's total liability to you for any
          claims arising from or related to your use of the Platform shall not exceed the amount you
          paid through the Platform in the 12 months preceding the claim.
        </Text>

        <Text style={styles.subHeading}>Consumer Rights</Text>
        <Text style={styles.paragraph}>
          Nothing in these Terms affects your statutory rights as a consumer under UK law, including
          the Consumer Rights Act 2015.
        </Text>

        {/* Section 11 */}
        <Text style={styles.sectionHeading}>11. Changes to These Terms</Text>
        <Text style={styles.paragraph}>
          We may update these Terms from time to time. If we make material changes, we will notify you
          through the app or by email. Continued use of the Platform after changes take effect
          constitutes acceptance of the revised Terms.
        </Text>

        {/* Section 12 */}
        <Text style={styles.sectionHeading}>12. Governing Law and Jurisdiction</Text>
        <Text style={styles.paragraph}>
          These Terms are governed by the laws of England and Wales. Any disputes arising from or in
          connection with these Terms shall be subject to the exclusive jurisdiction of the courts of
          England and Wales.
        </Text>

        {/* Section 13 */}
        <Text style={styles.sectionHeading}>13. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about these Terms, please contact us:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            {'\u2022'} Email: support@freshlocal.co.uk
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Post: FreshLocal Ltd, 71-75 Shelton Street, London, WC2H 9JQ
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} In-app: Use the Help & Support section in your account settings
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            FreshLocal Ltd is registered in England and Wales.{'\n'}Company registration number:
            15678901.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backArrow: {
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  lastUpdated: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing['2xl'],
  },
  sectionHeading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    marginTop: spacing['2xl'],
    marginBottom: spacing.md,
  },
  subHeading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  bulletList: {
    marginBottom: spacing.md,
    paddingLeft: spacing.sm,
  },
  bulletItem: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  footer: {
    marginTop: spacing['3xl'],
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});
