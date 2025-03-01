'use client';

import React, { useState } from 'react';
import { Button, Input, Select, SelectItem } from '@heroui/react';
import { Plus, Minus } from 'lucide-react';

interface CreatePollProps {
  onSubmit: (pollData: {
    question: string;
    options: string[];
    expiresAt: Date;
  }) => void;
}

export const CreatePoll: React.FC<CreatePollProps> = ({ onSubmit }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(24); // 默认24小时

  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];

    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    if (question.trim() && options.every((option) => option.trim())) {
      const expiresAt = new Date();

      expiresAt.setHours(expiresAt.getHours() + duration);

      onSubmit({
        question: question.trim(),
        options: options.map((option) => option.trim()),
        expiresAt,
      });
    }
  };

  return (
    <div className="space-y-4 mt-4 p-4 border border-divider rounded-lg">
      <Input
        label="Poll Question"
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
            />
            {index >= 2 && (
              <Button
                isIconOnly
                color="danger"
                variant="light"
                onClick={() => removeOption(index)}
              >
                <Minus size={18} />
              </Button>
            )}
          </div>
        ))}
      </div>

      {options.length < 4 && (
        <Button
          className="w-full"
          startContent={<Plus size={18} />}
          variant="flat"
          onClick={addOption}
        >
          Add option
        </Button>
      )}

      <div className="flex items-center gap-2 justify-between">
        <span className="text-sm text-default-500">Poll duration:</span>
        <Select
          className="bg-transparent rounded px-2 py-1 flex-1 max-w-48"
          placeholder="Select duration"
          value={duration}
          variant="bordered"
          onChange={(e) => setDuration(Number(e.target.value))}
        >
          <SelectItem key={24}>1 day</SelectItem>
          <SelectItem key={72}>3 days</SelectItem>
          <SelectItem key={168}>7 days</SelectItem>
        </Select>
      </div>

      <Button
        className="w-full mt-4"
        color="primary"
        isDisabled={
          !question.trim() || !options.every((option) => option.trim())
        }
        onClick={handleSubmit}
      >
        Create Poll
      </Button>
    </div>
  );
};
