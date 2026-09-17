"use client";

import React from "react";

export type MakiIconName =
  | "lightning"
  | "caution"
  | "traffic-light"
  | "emergency-phone"
  | "communications-tower"
  | "waveform"
  | "fire-station"
  | "police"
  | "hospital"
  | "water"
  | "car"
  | "bus"
  | "rail"
  | "hazard"
  | "alert"
  | "drone"
  | "uav"
  | "default";

interface MakiIconProps extends React.SVGProps<SVGSVGElement> {
  name: MakiIconName | string;
  size?: number;
  className?: string;
}

/**
 * Official Mapbox Maki Icon Set Vector Renderer
 * https://github.com/mapbox/maki
 */
export function MakiIcon({ name, size = 15, className = "", ...props }: MakiIconProps) {
  const normalizedName = name ? name.toLowerCase().trim() : "default";

  const renderPath = () => {
    switch (normalizedName) {
      case "lightning":
      case "power":
      case "electricity":
      case "substation":
        // Mapbox Maki Electricity / Lightning 15px icon
        return (
          <path d="M8.5 1L2 8.5h4.5L5 14l8.5-7.5H9L11.5 1z" />
        );

      case "caution":
      case "voltage":
      case "surge":
      case "danger":
        // Mapbox Maki Danger / Caution 15px icon
        return (
          <path d="M7.5 1L1 13.5h13L7.5 1zm0 2.8L12.1 12H2.9L7.5 3.8zm-.75 2.7v3.5h1.5v-3.5h-1.5zm0 4.5v1.5h1.5v-1.5h-1.5z" />
        );

      case "traffic-light":
      case "signal":
      case "traffic":
        // Mapbox Maki Traffic Light 15px icon
        return (
          <path d="M4.5 1C3.67 1 3 1.67 3 2.5v10c0 .83.67 1.5 1.5 1.5h6c.83 0 1.5-.67 1.5-1.5v-10C12 1.67 11.33 1 10.5 1h-6zM7.5 2.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm0 3.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm0 3.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z" />
        );

      case "emergency-phone":
      case "dispatch":
      case "siren":
      case "ambulance":
        // Mapbox Maki Emergency Phone 15px icon
        return (
          <path d="M4 1C2.9 1 2 1.9 2 3v9c0 1.1.9 2 2 2h7c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2H4zm3.5 1.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm-2.5 3.8h5v5H5v-5zm2 1v1h-1v1h1v1h1v-1h1v-1h-1v-1h-1z" />
        );

      case "communications-tower":
      case "telecom":
      case "radio":
      case "fiber":
      case "network":
        // Mapbox Maki Communications Tower 15px icon
        return (
          <path d="M7.5 1C6.67 1 6 1.67 6 2.5c0 .52.26.97.66 1.25L4.5 14h1.62l.74-3.5h1.28l.74 3.5h1.62L8.34 3.75c.4-.28.66-.73.66-1.25C9 1.67 8.33 1 7.5 1zm0 1a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1zM2.8 4.2a.5.5 0 0 0-.7.7A6.97 6.97 0 0 1 4 8.5c0 1.35-.38 2.61-1.04 3.67a.5.5 0 1 0 .84.54A7.96 7.96 0 0 0 5 8.5c0-1.54-.44-2.98-1.2-4.3zm9.4 0a.5.5 0 0 0-.76.64A6.97 6.97 0 0 1 11 8.5c0 1.35.38 2.61 1.04 3.67a.5.5 0 1 0 .84-.54A7.96 7.96 0 0 0 10 8.5c0-1.54.44-2.98 1.2-4.3z" />
        );

      case "waveform":
      case "sensor":
      case "radar":
      case "acoustic":
        // Mapbox Maki Waveform / Sensor Radar 15px icon
        return (
          <path d="M7.5 1A6.5 6.5 0 0 0 1 7.5a.5.5 0 0 0 1 0 5.5 5.5 0 0 1 11 0 .5.5 0 0 0 1 0A6.5 6.5 0 0 0 7.5 1zm0 2.5A4 4 0 0 0 3.5 7.5a.5.5 0 0 0 1 0 3 3 0 0 1 6 0 .5.5 0 0 0 1 0A4 4 0 0 0 7.5 3.5zm0 2.5A1.5 1.5 0 1 0 9 7.5a.5.5 0 0 0-1 0 1.5 1.5 0 0 0-1.5-1.5z" />
        );

      case "fire-station":
      case "fire":
      case "flame":
        // Mapbox Maki Flame 15px icon
        return (
          <path d="M7.5 1C5.5 3.5 4 6 4 8.5 4 10.98 5.57 13 7.5 13s3.5-2.02 3.5-4.5c0-2.5-1.5-5-3.5-7.5zm.5 5.5c1 1.5.5 3 0 4-.5-1-1-2 0-4z" />
        );

      case "police":
      case "shield":
      case "security":
        // Mapbox Maki Shield 15px icon
        return (
          <path d="M7.5 1L2 3.5V7c0 3.5 2.5 6.5 5.5 7 3-0.5 5.5-3.5 5.5-7V3.5L7.5 1zm0 2.2l3.5 1.6V7c0 2.5-1.8 4.7-3.5 5.2C5.8 11.7 4 9.5 4 7V4.8l3.5-1.6z" />
        );

      case "hospital":
      case "medical":
        // Mapbox Maki Hospital 15px icon (Cross)
        return <path d="M6 2v4H2v3h4v4h3V9h4V6H9V2H6z" />;

      case "clinic":
      case "stethoscope":
      case "health-center":
        // Stethoscope icon for outpatient clinics & health centers
        return (
          <path d="M4 1v4a3.5 3.5 0 0 0 7 0V1m-7 0H2v2.5a5.5 5.5 0 0 0 11 0V1h-2m-2 7.5v2a2 2 0 0 0 2 2h.5A2.5 2.5 0 1 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        );

      case "car":
        // Mapbox Maki Car 15px icon
        return (
          <path d="M3 4l-1.5 4H1v4h1.5a1.5 1.5 0 0 0 3 0h5a1.5 1.5 0 0 0 3 0H15V8h-.5L12 4H3zm1 1.5h7l1 2.5H3l1-2.5zm-1 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm8 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
        );

      case "bus":
        // Mapbox Maki Bus 15px icon
        return (
          <path d="M3 1c-.8 0-1.5.7-1.5 1.5v9.5c0 .8.7 1.5 1.5 1.5h.5a1 1 0 0 0 2 0h4a1 1 0 0 0 2 0h.5c.8 0 1.5-.7 1.5-1.5V2.5C13.5 1.7 12.8 1 12 1H3zm.5 2h8v3h-8V3zm1 5.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm6 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
        );

      case "rail":
      case "train":
        // Mapbox Maki Rail 15px icon
        return (
          <path d="M3.5 1C2.7 1 2 1.7 2 2.5v7c0 .8.7 1.5 1.5 1.5l-1.5 2h1.5l.8-1h6.4l.8 1h1.5l-1.5-2c.8 0 1.5-.7 1.5-1.5v-7C13 1.7 12.3 1 11.5 1h-8zm.5 2h7v3h-7V3zm1 5.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm5 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
        );

      case "water":
      case "droplet":
        // Mapbox Maki Water 15px icon
        return (
          <path d="M7.5 1C5.5 4 3 6.5 3 9a4.5 4.5 0 0 0 9 0c0-2.5-2.5-5-4.5-8z" />
        );

      case "drone":
      case "uav":
      case "quadcopter":
        // Dedicated Quadcopter Drone 15px icon
        return (
          <path d="M7.5 5.5C6.4 5.5 5.5 6.4 5.5 7.5S6.4 9.5 7.5 9.5 9.5 8.6 9.5 7.5 8.6 5.5 7.5 5.5zm-5-4C1.7 1.5 1 2.2 1 3s.7 1.5 1.5 1.5S4 3.8 4 3s-.7-1.5-1.5-1.5zm10 0c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5S14 3.8 14 3s-.7-1.5-1.5-1.5zm-10 9C1.7 10.5 1 11.2 1 12s.7 1.5 1.5 1.5S4 12.8 4 12s-.7-1.5-1.5-1.5zm10 0c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.7-1.5-1.5-1.5zM3.8 3.8l2.2 2.2M11.2 3.8L9 6M3.8 11.2L6 9m5.2 2.2L9 9" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        );

      case "hazard":
      case "alert":
      case "default":
      default:
        // Mapbox Maki Warning Triangle 15px icon
        return (
          <path d="M7.5 1.5L1 13h13L7.5 1.5zm0 3.5l4 6.5h-8l4-6.5zm-.75 2v2.5h1.5V7h-1.5zm0 3.5v1h1.5v-1h-1.5z" />
        );
    }
  };

  return (
    <svg
      viewBox="0 0 15 15"
      width={size}
      height={size}
      fill="currentColor"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    >
      {renderPath()}
    </svg>
  );
}

/**
 * Utility function to resolve standard Maki icon name from incident parameters
 */
export function getMakiIconNameForIncident(incident: {
  makiIcon?: string;
  category?: string;
  title?: string;
}): MakiIconName {
  if (incident.makiIcon) {
    return incident.makiIcon as MakiIconName;
  }

  const titleLower = incident.title?.toLowerCase() || "";
  const catLower = incident.category?.toLowerCase() || "";

  if (titleLower.includes("drone") || titleLower.includes("uav") || titleLower.includes("quadcopter") || catLower.includes("drone")) {
    return "drone";
  }
  if (titleLower.includes("substation") || titleLower.includes("tripped") || titleLower.includes("power")) {
    return "lightning";
  }
  if (titleLower.includes("surge") || titleLower.includes("voltage") || titleLower.includes("breaker")) {
    return "caution";
  }
  if (titleLower.includes("signal") || titleLower.includes("traffic") || catLower.includes("traffic")) {
    return "traffic-light";
  }
  if (titleLower.includes("dispatch") || titleLower.includes("emergency") || catLower.includes("emergency")) {
    return "emergency-phone";
  }
  if (titleLower.includes("fiber") || titleLower.includes("gateway") || titleLower.includes("telecom") || catLower.includes("telecom")) {
    return "communications-tower";
  }
  if (titleLower.includes("sensor") || titleLower.includes("acoustic") || titleLower.includes("vibration") || catLower.includes("sensor")) {
    return "waveform";
  }

  if (catLower.includes("drone") || catLower.includes("uav")) return "drone";
  if (catLower.includes("grid")) return "lightning";
  if (catLower.includes("traffic")) return "traffic-light";
  if (catLower.includes("emergency")) return "emergency-phone";
  if (catLower.includes("telecom")) return "communications-tower";
  if (catLower.includes("sensor")) return "waveform";

  return "caution";
}
