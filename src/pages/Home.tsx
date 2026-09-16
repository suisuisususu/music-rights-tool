import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Music, Search, Calculator, Languages } from "lucide-react";
import { useLang } from "@/providers/language";
import LookupSection from "@/sections/LookupSection";
import EstimateSection from "@/sections/EstimateSection";

export default function Home() {
  const { lang, setLang, t } = useLang();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Music className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">{t("app.title")}</h1>
            <p className="text-sm text-slate-500">{t("app.subtitle")}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
          >
            <Languages className="h-4 w-4" />
            {lang === "zh" ? "EN" : "中文"}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Tabs defaultValue="lookup">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="lookup" className="gap-2">
              <Search className="h-4 w-4" />
              {t("tab.lookup")}
            </TabsTrigger>
            <TabsTrigger value="estimate" className="gap-2">
              <Calculator className="h-4 w-4" />
              {t("tab.estimate")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="lookup" className="mt-6">
            <LookupSection />
          </TabsContent>
          <TabsContent value="estimate" className="mt-6">
            <EstimateSection />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-white py-6">
        <p className="mx-auto max-w-5xl px-4 text-xs text-slate-400">{t("footer.note")}</p>
      </footer>
    </div>
  );
}
