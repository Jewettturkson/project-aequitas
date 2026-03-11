import Image from "next/image";

type BrandLogoProps = {
  variant?: "full" | "icon" | "auto";
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({ variant = "auto", className = "", priority = false }: BrandLogoProps) {
  return (
    <div className={`relative ${className}`} aria-label="TurkNode branding">
      {variant === "icon" ? (
        <Image
          src="/branding/turknode-icon.svg"
          alt="TurkNode icon"
          fill
          priority={priority}
          className="object-contain"
          sizes="(max-width: 768px) 64px, 96px"
        />
      ) : variant === "full" ? (
        <Image
          src="/branding/turknode-full.svg"
          alt="TurkNode logo"
          fill
          priority={priority}
          className="object-contain"
          sizes="(max-width: 768px) 220px, 320px"
        />
      ) : (
        <>
          <div className="relative hidden h-full w-full sm:block">
            <Image
              src="/branding/turknode-full.svg"
              alt="TurkNode logo"
              fill
              priority={priority}
              className="object-contain"
              sizes="(max-width: 1024px) 240px, 340px"
            />
          </div>
          <div className="relative h-full w-full sm:hidden">
            <Image
              src="/branding/turknode-icon.svg"
              alt="TurkNode icon"
              fill
              priority={priority}
              className="object-contain"
              sizes="88px"
            />
          </div>
        </>
      )}
    </div>
  );
}
