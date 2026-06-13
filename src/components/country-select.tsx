import { useState } from "react";
import { Check, ChevronsUpDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COUNTRIES, getCountry } from "@/lib/countries";

interface CountrySelectProps {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function CountrySelect({
  value,
  onChange,
  placeholder = "Select your country",
  disabled,
  id,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const selected = getCountry(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            {selected ? (
              <>
                <span className="text-base leading-none">{selected.flag}</span>
                <span className="truncate">{selected.name}</span>
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{placeholder}</span>
              </>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command
          filter={(value, search) => {
            const q = search.toLowerCase();
            return value.toLowerCase().includes(q) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search country…" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.name} ${c.code}`}
                  onSelect={() => {
                    onChange(c.code);
                    setOpen(false);
                  }}
                >
                  <span className="mr-2 text-base leading-none">{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{c.code}</span>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      value === c.code ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Best-effort country guess from the browser's IANA timezone. */
export function guessCountryFromTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const map: Record<string, string> = {
      "Africa/Lagos": "NG",
      "Africa/Accra": "GH",
      "Africa/Nairobi": "KE",
      "Africa/Johannesburg": "ZA",
      "Africa/Cairo": "EG",
      "Africa/Casablanca": "MA",
      "Africa/Algiers": "DZ",
      "Africa/Tunis": "TN",
      "Africa/Addis_Ababa": "ET",
      "Africa/Dakar": "SN",
      "America/New_York": "US",
      "America/Chicago": "US",
      "America/Denver": "US",
      "America/Los_Angeles": "US",
      "America/Toronto": "CA",
      "America/Vancouver": "CA",
      "America/Mexico_City": "MX",
      "America/Sao_Paulo": "BR",
      "America/Buenos_Aires": "AR",
      "Europe/London": "GB",
      "Europe/Dublin": "IE",
      "Europe/Paris": "FR",
      "Europe/Berlin": "DE",
      "Europe/Madrid": "ES",
      "Europe/Rome": "IT",
      "Europe/Amsterdam": "NL",
      "Europe/Stockholm": "SE",
      "Europe/Oslo": "NO",
      "Europe/Warsaw": "PL",
      "Europe/Moscow": "RU",
      "Asia/Dubai": "AE",
      "Asia/Riyadh": "SA",
      "Asia/Karachi": "PK",
      "Asia/Kolkata": "IN",
      "Asia/Calcutta": "IN",
      "Asia/Dhaka": "BD",
      "Asia/Bangkok": "TH",
      "Asia/Singapore": "SG",
      "Asia/Kuala_Lumpur": "MY",
      "Asia/Jakarta": "ID",
      "Asia/Manila": "PH",
      "Asia/Tokyo": "JP",
      "Asia/Seoul": "KR",
      "Asia/Shanghai": "CN",
      "Asia/Hong_Kong": "HK",
      "Australia/Sydney": "AU",
      "Australia/Melbourne": "AU",
      "Pacific/Auckland": "NZ",
    };
    return map[tz] ?? "";
  } catch {
    return "";
  }
}
