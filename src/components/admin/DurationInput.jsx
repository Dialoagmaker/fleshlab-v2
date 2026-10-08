import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function DurationInput({ value, onChange }) {
    const [rawInput, setRawInput] = useState("");

    const formatDisplay = (secs) => {
        if (!secs) return "";
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const parseInput = (val) => {
        const match = val.match(/^(\d+):(\d{1,2})$/);
        if (match) {
            const m = parseInt(match[1]);
            const s = parseInt(match[2]);
            if (s < 60) {
                return m * 60 + s;
            }
        }
        return null;
    };

    const handleChange = (e) => {
        const val = e.target.value;
        setRawInput(val);
        
        const secs = parseInput(val);
        if (secs !== null) {
            onChange(secs);
        } else if (val === "") {
            onChange("");
        }
    };

    const handleBlur = () => {
        if (rawInput) {
            const secs = parseInput(rawInput);
            if (secs === null) {
                setRawInput("");
                onChange("");
            } else {
                setRawInput(formatDisplay(secs));
            }
        }
    };

    const displayValue = rawInput || formatDisplay(value);

    return (
        <Input
            type="text"
            placeholder="00:00"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className="font-mono"
        />
    );
}