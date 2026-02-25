import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Header } from '@/components/layout';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Privacy Policy"
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
          FreshLocal Ltd ("FreshLocal", "we", "us", or "our") is committed to protecting your privacy
          and handling your personal data responsibly. This Privacy Policy explains how we collect,
          use, share, and protect your information when you use the FreshLocal mobile application and
          related services (the "Platform").
        </Text>
        <Text style={styles.paragraph}>
          This policy complies with the UK General Data Protection Regulation (UK GDPR) and the Data
          Protection Act 2018.
        </Text>

        {/* Section 1 */}
        <Text style={styles.sectionHeading}>1. Data Controller</Text>
        <Text style={styles.paragraph}>
          The data controller responsible for your personal data is:
        </Text>
        <View style={styles.infoBlock}>
          <Text style={styles.infoBlockText}>FreshLocal Ltd</Text>
          <Text style={styles.infoBlockText}>71-75 Shelton Street</Text>
          <Text style={styles.infoBlockText}>London, WC2H 9JQ</Text>
          <Text style={styles.infoBlockText}>United Kingdom</Text>
          <Text style={[styles.infoBlockText, { marginTop: spacing.sm }]}>
            Data Protection Contact: privacy@freshlocal.co.uk
          </Text>
        </View>

        {/* Section 2 */}
        <Text style={styles.sectionHeading}>2. What Data We Collect</Text>

        <Text style={styles.subHeading}>Information You Provide</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            {'\u2022'} Account information: Full name, email address, phone number, and password.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Profile information: Profile photo (optional), delivery address, and postcode.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Order information: Items ordered, order notes, delivery preferences, and
            dietary requirements you choose to share.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Communications: Messages you send to vendors or to our support team.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Vendor-specific data (if applicable): Business name, business type, food
            hygiene registration details, bank account information (via Stripe Connect), and product
            listings.
          </Text>
        </View>

        <Text style={styles.subHeading}>Information Collected Automatically</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            {'\u2022'} Location data: Your approximate location (when you grant permission) to show
            nearby vendors.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Device information: Device type, operating system, app version, and unique
            device identifiers.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Usage data: Pages viewed, features used, search queries, and interaction
            patterns.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Log data: IP address, access times, and referring URLs.
          </Text>
        </View>

        <Text style={styles.subHeading}>Information from Third Parties</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            {'\u2022'} Stripe: Payment confirmation, transaction status, and fraud-prevention
            signals. We do not receive or store your full card number.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Authentication providers: If you sign in via Apple or Google, we receive your
            name and email address as permitted by those services.
          </Text>
        </View>

        {/* Section 3 */}
        <Text style={styles.sectionHeading}>3. Legal Basis for Processing</Text>
        <Text style={styles.paragraph}>
          We process your personal data on the following legal bases under UK GDPR:
        </Text>

        <View style={styles.tableContainer}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeaderCell]}>Purpose</Text>
            <Text style={[styles.tableCell, styles.tableHeaderCell]}>Legal Basis</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Account management</Text>
            <Text style={styles.tableCell}>Performance of contract</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Processing orders and payments</Text>
            <Text style={styles.tableCell}>Performance of contract</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Order updates and receipts</Text>
            <Text style={styles.tableCell}>Performance of contract</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Location-based services</Text>
            <Text style={styles.tableCell}>Your consent</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Improving the Platform</Text>
            <Text style={styles.tableCell}>Legitimate interests</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Fraud prevention and security</Text>
            <Text style={styles.tableCell}>Legitimate interests</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Marketing communications</Text>
            <Text style={styles.tableCell}>Your consent</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Legal compliance</Text>
            <Text style={styles.tableCell}>Legal obligation</Text>
          </View>
        </View>

        {/* Section 4 */}
        <Text style={styles.sectionHeading}>4. How We Use Your Data</Text>
        <Text style={styles.paragraph}>We use the information we collect to:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            {'\u2022'} Provide our service: Create your account, process orders, facilitate payments,
            and connect you with vendors.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Communicate with you: Send order confirmations, delivery updates, receipts,
            and customer support responses.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Personalise your experience: Show relevant vendors, suggest items based on
            your order history, and remember your preferences.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Improve the Platform: Analyse usage patterns, diagnose technical issues, and
            develop new features.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Ensure safety and security: Detect fraud, enforce our terms, and protect users
            and vendors.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Legal compliance: Respond to legal requests, resolve disputes, and meet
            regulatory requirements.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Marketing (with your consent): Send promotional offers, new vendor
            announcements, and seasonal recommendations. You can opt out at any time.
          </Text>
        </View>

        {/* Section 5 */}
        <Text style={styles.sectionHeading}>5. Who We Share Your Data With</Text>
        <Text style={styles.paragraph}>
          We only share your personal data when necessary and with appropriate safeguards:
        </Text>

        <Text style={styles.subHeading}>Vendors</Text>
        <Text style={styles.paragraph}>
          When you place an order, we share your name, delivery address, phone number, and order
          details with the vendor so they can fulfil your order. Vendors are required to handle your
          data in accordance with data protection law.
        </Text>

        <Text style={styles.subHeading}>Stripe</Text>
        <Text style={styles.paragraph}>
          We use Stripe to process payments. Stripe receives your payment card details directly (we
          never see your full card number). Stripe processes data as an independent data controller.
        </Text>

        <Text style={styles.subHeading}>Service Providers</Text>
        <Text style={styles.paragraph}>
          We use trusted service providers for cloud hosting, analytics, push notifications, and
          customer support tools. All service providers are bound by data processing agreements and
          may only process your data on our instructions.
        </Text>

        <Text style={styles.subHeading}>Legal and Regulatory</Text>
        <Text style={styles.paragraph}>
          We may disclose your data if required by law, court order, or regulatory authority, or where
          necessary to protect the rights, safety, or property of FreshLocal, our users, or the
          public.
        </Text>

        <Text style={styles.paragraphBold}>
          We do not sell your personal data to third parties.
        </Text>

        {/* Section 6 */}
        <Text style={styles.sectionHeading}>6. Data Retention</Text>
        <Text style={styles.paragraph}>
          We keep your data only for as long as necessary:
        </Text>

        <View style={styles.tableContainer}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeaderCell]}>Data Type</Text>
            <Text style={[styles.tableCell, styles.tableHeaderCell]}>Retention</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Account info</Text>
            <Text style={styles.tableCell}>Account life + 2 years</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Order history</Text>
            <Text style={styles.tableCell}>6 years (tax/legal)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Payment records</Text>
            <Text style={styles.tableCell}>6 years (HMRC)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Location data</Text>
            <Text style={styles.tableCell}>90 days (rolling)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Usage/analytics</Text>
            <Text style={styles.tableCell}>2 years</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Support chats</Text>
            <Text style={styles.tableCell}>3 years</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Marketing prefs</Text>
            <Text style={styles.tableCell}>Until you withdraw</Text>
          </View>
        </View>

        <Text style={styles.paragraph}>
          When data is no longer needed, it is securely deleted or anonymised.
        </Text>

        {/* Section 7 */}
        <Text style={styles.sectionHeading}>7. Your Rights Under UK GDPR</Text>
        <Text style={styles.paragraph}>
          You have the following rights regarding your personal data:
        </Text>

        <Text style={styles.subHeading}>Right of Access</Text>
        <Text style={styles.paragraph}>
          You can request a copy of the personal data we hold about you. We will respond within one
          month.
        </Text>

        <Text style={styles.subHeading}>Right to Rectification</Text>
        <Text style={styles.paragraph}>
          You can ask us to correct inaccurate or incomplete data. You can also update most
          information directly in the app under Account Settings.
        </Text>

        <Text style={styles.subHeading}>Right to Erasure</Text>
        <Text style={styles.paragraph}>
          You can request deletion of your personal data. We will comply unless we have a legal
          obligation to retain it (such as financial records required by HMRC).
        </Text>

        <Text style={styles.subHeading}>Right to Restriction of Processing</Text>
        <Text style={styles.paragraph}>
          You can ask us to limit how we use your data in certain circumstances, for example while we
          investigate a complaint.
        </Text>

        <Text style={styles.subHeading}>Right to Data Portability</Text>
        <Text style={styles.paragraph}>
          You can request your data in a structured, commonly used, machine-readable format (such as
          JSON or CSV) and have it transferred to another service where technically feasible.
        </Text>

        <Text style={styles.subHeading}>Right to Object</Text>
        <Text style={styles.paragraph}>
          You can object to processing based on legitimate interests. You can also object to direct
          marketing at any time, and we will stop immediately.
        </Text>

        <Text style={styles.subHeading}>Automated Decision-Making</Text>
        <Text style={styles.paragraph}>
          We do not currently make decisions based solely on automated processing that have a legal or
          similarly significant effect on you.
        </Text>

        <Text style={styles.subHeading}>How to Exercise Your Rights</Text>
        <Text style={styles.paragraph}>
          To exercise any of these rights, contact us at privacy@freshlocal.co.uk. We will verify
          your identity before processing your request and respond within one month. If your request
          is complex, we may extend this by up to two additional months.
        </Text>

        {/* Section 8 */}
        <Text style={styles.sectionHeading}>8. Cookies and Tracking</Text>
        <Text style={styles.paragraph}>
          The FreshLocal app does not use browser cookies. We use local device storage to keep you
          signed in, store your preferences (such as preferred location and dietary filters), and
          cache data for offline use and faster loading.
        </Text>
        <Text style={styles.paragraph}>
          We collect anonymised usage data to understand how the app is used and to improve the
          experience. You can opt out of analytics tracking in the app settings.
        </Text>
        <Text style={styles.paragraph}>
          The app may include third-party software development kits (SDKs) for functionality such as
          crash reporting and push notifications. These SDKs may collect device-level information as
          described in their respective privacy policies.
        </Text>

        {/* Section 9 */}
        <Text style={styles.sectionHeading}>9. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          FreshLocal is not intended for children under 18. We do not knowingly collect personal data
          from anyone under 18 years of age. If we become aware that we have collected data from a
          child, we will take steps to delete it promptly.
        </Text>
        <Text style={styles.paragraph}>
          If you believe a child has provided us with personal data, please contact us at
          privacy@freshlocal.co.uk.
        </Text>

        {/* Section 10 */}
        <Text style={styles.sectionHeading}>10. Data Security</Text>
        <Text style={styles.paragraph}>
          We take the security of your data seriously and implement appropriate technical and
          organisational measures, including:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            {'\u2022'} Encryption: Data is encrypted in transit (TLS 1.2+) and at rest.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Access controls: Staff access to personal data is restricted on a
            need-to-know basis and protected by multi-factor authentication.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Infrastructure: We use reputable cloud providers with ISO 27001 and SOC 2
            certifications.
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Monitoring: We monitor for security incidents and have procedures for breach
            detection and response.
          </Text>
        </View>
        <Text style={styles.paragraph}>
          If a data breach occurs that poses a high risk to your rights, we will notify you and the
          Information Commissioner's Office (ICO) within 72 hours as required by UK GDPR.
        </Text>

        {/* Section 11 */}
        <Text style={styles.sectionHeading}>11. International Data Transfers</Text>
        <Text style={styles.paragraph}>
          Your data is primarily stored in the United Kingdom and European Economic Area (EEA). Where
          data is transferred outside the UK/EEA, we ensure appropriate safeguards are in place, such
          as UK International Data Transfer Agreements (IDTAs), Standard Contractual Clauses approved
          by the ICO, and adequacy decisions by the UK government.
        </Text>

        {/* Section 12 */}
        <Text style={styles.sectionHeading}>12. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. If we make material changes, we will
          notify you via the app or by email before the changes take effect. The "Last updated" date
          at the top indicates the most recent revision.
        </Text>

        {/* Section 13 */}
        <Text style={styles.sectionHeading}>13. Contact Us and Complaints</Text>

        <Text style={styles.subHeading}>Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions, concerns, or requests about your personal data, please contact us:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            {'\u2022'} Email: privacy@freshlocal.co.uk
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Post: FreshLocal Ltd, 71-75 Shelton Street, London, WC2H 9JQ
          </Text>
        </View>

        <Text style={styles.subHeading}>Complaints to the ICO</Text>
        <Text style={styles.paragraph}>
          If you are not satisfied with how we handle your data, you have the right to lodge a
          complaint with the Information Commissioner's Office (ICO):
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            {'\u2022'} Website: ico.org.uk/make-a-complaint/
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Helpline: 0303 123 1113
          </Text>
          <Text style={styles.bulletItem}>
            {'\u2022'} Post: Information Commissioner's Office, Wycliffe House, Water Lane, Wilmslow,
            Cheshire, SK9 5AF
          </Text>
        </View>
        <Text style={styles.paragraph}>
          We encourage you to contact us first so we can try to resolve any concerns directly.
        </Text>

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
  paragraphBold: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
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
  infoBlock: {
    backgroundColor: colors.cardBackground,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoBlockText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  tableContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tableCell: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tableHeaderCell: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    backgroundColor: colors.grey100,
    paddingVertical: spacing.md,
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
