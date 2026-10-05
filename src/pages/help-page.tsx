import { Link } from "@tanstack/react-router";
import { Bot, FileCheck2, Headphones, HelpCircle, Search } from "lucide-react";
import { AppShell, PageHeader } from "@/components/krishi/app-shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useApp, t } from "@/context/app-context";
import type { Language } from "@/types/app";

const localizedFaqs: Record<Language, { q: string; a: string }[]> = {
  ta: [
    {
      q: "திட்டம் இணைப்பு ஒரு அதிகாரப்பூர்வ அரசு வலைதளமா?",
      a: "இல்லை. இது விவசாயத் திட்டங்களை எளிதாகக் கண்டறிய உதவும் ஒரு மாதிரி வழிகாட்டி. விண்ணப்பிக்கும் முன் அதிகாரப்பூர்வ வலைதளத்தில் விவரங்களைச் சரிபார்க்கவும்.",
    },
    {
      q: "தகுதி முடிவுகள் இறுதியானவையா?",
      a: "இல்லை. இந்த முடிவுகள் டெமோ அடிப்படையிலானவை. அரசு அதிகாரிகளே இறுதி முடிவை எடுப்பார்கள்.",
    },
    {
      q: "இச்செயலி என் ஆதார் அல்லது வங்கி விவரங்களை சேமிக்கிறதா?",
      a: "இல்லை. இந்த முன்மாதிரி செயலி எந்த சர்வர்க்கும் தரவை அனுப்புவதில்லை. மாதிரி விவரங்கள் உங்கள் உலாவியில் மட்டுமே இருக்கும்.",
    },
    {
      q: "என் தாய்மொழியில் செயலியைப் பயன்படுத்த முடியுமா?",
      a: "ஆம். மொழி மெனுவைப் பயன்படுத்தி தமிழ், தெலுங்கு, இந்தி மற்றும் ஆங்கிலத்தில் முழு உள்ளடக்கத்தையும் பெறலாம்.",
    },
    {
      q: "ஒரு திட்டத்தை எவ்வாறு சேமிப்பது?",
      a: "திட்ட அட்டையில் உள்ள புக்மார்க் ஐகானைத் தேர்வு செய்யவும். உங்கள் சேமிக்கப்பட்ட பட்டியல் உங்கள் உலாவியில் பாதுகாப்பாக இருக்கும்.",
    },
  ],
  te: [
    {
      q: "స్కీమ్ కనెక్ట్ అధికారిక ప్రభుత్వ పోర్టలా?",
      a: "కాదు. ఇది పథకాల అన్వేషణను సులభతరం చేసే డెమో సహాయకుడు. దరఖాస్తు చేయడానికి ముందు అధికారిక పోర్టల్‌లో వివరాలను ధృవీకరించుకోండి.",
    },
    {
      q: "అర్హత ఫలితాలు తుది ఫలితాలా?",
      a: "కాదు. ఫలితాలు డెమో విశ్లేషణ ఆధారంగా ఉంటాయి. ప్రభుత్వ అధికారులే తుది నిర్ణయం తీసుకుంటారు.",
    },
    {
      q: "ఈ యాప్ నా ఆధార్ లేదా బ్యాంక్ వివరాలను సేవ్ చేస్తుందా?",
      a: "లేదు. ఈ ఫ్రంటెండ్ డెమో సర్వర్‌కు ఎటువంటి సమాచారాన్ని పంపదు. సమాచారం మీ బ్రౌజర్‌లో మాత్రమే ఉంటుంది.",
    },
    {
      q: "నేను నా మాతృభాషలో యాప్‌ను ఉపయోగించవచ్చా?",
      a: "అవును. తెలుగు, తమిళం, హిందీ మరియు ఇంగ్లీష్ భాషలలో పూర్తి వెబ్‌సైట్‌ను చూడవచ్చు.",
    },
    {
      q: "పథకాన్ని ఎలా సేవ్ చేయాలి?",
      a: "ఏదైనా పథకం కార్డుపై ఉన్న బుక్‌మార్క్ బటన్‌ను క్లిక్ చేయండి. మీ సేవ్ చేసిన జాబితా బ్రౌజర్‌లో ఉంటుంది.",
    },
  ],
  hi: [
    {
      q: "क्या स्कीम कनेक्ट एक आधिकारिक सरकारी पोर्टल है?",
      a: "नहीं। यह योजना खोज को सरल बनाने वाला एक प्रदर्शन सहायक है। आवेदन करने से पहले हमेशा आधिकारिक पोर्टल पर विवरण की पुष्टि करें।",
    },
    {
      q: "क्या पात्रता परिणाम अंतिम हैं?",
      a: "नहीं। परिणाम प्रदर्शन के लिए दिए गए हैं। अंतिम पात्रता सरकारी प्राधिकरण द्वारा तय की जाती है।",
    },
    {
      q: "क्या यह ऐप मेरे आधार या बैंक विवरण को सुरक्षित रखता है?",
      a: "हाँ। यह फ़्रंटएंड प्रदर्शन किसी भी सर्वर पर डेटा नहीं भेजता है। जानकारी केवल इसी ब्राउज़र में रहती है।",
    },
    {
      q: "क्या मैं अपनी भाषा में ऐप का उपयोग कर सकता हूँ?",
      a: "हाँ। भाषा मेनू से हिंदी, तेलुगु, तमिल और अंग्रेजी में पूरे पोर्टल का अनुवाद देखें।",
    },
    {
      q: "मैं किसी योजना को कैसे सहेजूं?",
      a: "किसी भी योजना कार्ड पर बुकमार्क बटन चुनें। आपकी सहेजी गई सूची इसी ब्राउज़र में उपलब्ध रहेगी।",
    },
  ],
  en: [
    {
      q: "Is Scheme Connect an official government portal?",
      a: "No. This is a demonstration assistant that simplifies scheme discovery. Always confirm details on the official department portal before applying.",
    },
    {
      q: "Are the eligibility results final?",
      a: "No. Results are based on mock browser logic for demonstration. Government authorities make the final eligibility decision.",
    },
    {
      q: "Does the app store my Aadhaar or bank details?",
      a: "No. This frontend demonstration does not send data to a server. Sample profile information stays in this browser only.",
    },
    {
      q: "Can I use the app in my language?",
      a: "Yes. Use the language menu to preview English, Telugu, Tamil and Hindi labels.",
    },
    {
      q: "How do I save a scheme?",
      a: "Select the bookmark button on any scheme card. Your saved list remains available in this browser.",
    },
  ],
};

export function HelpPage() {
  const { language } = useApp();
  const faqs = localizedFaqs[language] ?? localizedFaqs.en;

  const guideCards = [
    {
      icon: Bot,
      title: t(language, "Ask AI for help"),
      text: t(language, "help_ai_desc"),
      to: "/assistant" as const,
    },
    {
      icon: FileCheck2,
      title: t(language, "Check eligibility"),
      text: t(language, "help_eligibility_desc"),
      to: "/eligibility" as const,
    },
    {
      icon: Search,
      title: t(language, "Find schemes"),
      text: t(language, "help_schemes_desc"),
      to: "/schemes" as const,
    },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title={t(language, "Help & Support")}
          description={t(
            language,
            "Simple guidance to help you use Scheme Connect with confidence.",
          )}
        />

        <div className="grid gap-4 md:grid-cols-3">
          {guideCards.map(({ icon: Icon, title, text, to }) => (
            <section key={title} className="rounded-lg border bg-card p-5 shadow-sm">
              <span className="grid size-11 place-items-center rounded-lg bg-secondary text-primary">
                <Icon />
              </span>
              <h2 className="mt-4 font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              <Button asChild variant="link" className="mt-2 px-0">
                <Link to={to}>{t(language, "Open guide")}</Link>
              </Button>
            </section>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <HelpCircle className="text-primary" />
              {t(language, "Frequently asked questions")}
            </h2>
            <Accordion type="single" collapsible className="mt-3">
              {faqs.map((f, i) => (
                <AccordionItem key={f.q} value={String(i)}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-6 text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="h-fit rounded-lg bg-primary p-6 text-primary-foreground shadow-lg">
            <Headphones className="size-8" />
            <h2 className="mt-4 text-xl font-bold">{t(language, "Need more help?")}</h2>
            <p className="mt-2 text-sm leading-6 text-primary-foreground/80">
              {t(language, "need_help_desc")}
            </p>
            <Button variant="secondary" className="mt-5 w-full">
              {t(language, "Contact support")}
            </Button>
            <p className="mt-3 text-center text-xs text-primary-foreground/70">
              {t(language, "demo_support_time")}
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
