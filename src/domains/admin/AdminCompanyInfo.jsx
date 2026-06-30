import React, { useState } from 'react';
import { Bell, Check } from 'lucide-react';

const companyFields = [
  {
    title: '기본 정보',
    fields: [
      { label: '회사명', value: '오르빗 주식회사', required: true },
      { label: '대표자명', value: '김지훈', required: true },
      { label: '사업자등록번호', value: '123-45-67890', required: true },
      { label: '대표번호', value: '02-1234-5678', required: true },
      { label: '이메일', value: 'contact@orbit.co.kr', required: true },
    ],
  },
  {
    title: '주소 정보',
    fields: [
      {
        label: '대표주소',
        value: '서울특별시 강남구 테헤란로 123, 10층 (역삼동, 오르빗빌딩)',
        required: true,
        wide: true,
      },
      { label: '상세주소', value: '1001호' },
      { label: '팩스번호', value: '02-1234-5679' },
    ],
  },
];

const initialFormValues = companyFields.flatMap(({ fields }) => fields).reduce(
  (acc, field) => ({ ...acc, [field.label]: field.value }),
  {}
);

const validationRules = {
  회사명: {
    maxLength: 30,
    message: '회사명은 30자 이하로 입력해 주세요.',
  },
  대표자명: {
    maxLength: 20,
    pattern: /^[A-Za-z가-힣]+$/,
    message: '대표자명은 20자 이하의 한글 또는 영문만 입력해 주세요.',
  },
  사업자등록번호: {
    maxLength: 12,
    pattern: /^\d{3}-\d{2}-\d{5}$/,
    message: '사업자등록번호는 123-45-67890 형식으로 입력해 주세요.',
  },
  대표번호: {
    maxLength: 13,
    pattern: /^(?:\d{2}-\d{3}-\d{4}|\d{3}-\d{4}-\d{4}|\d{2}-\d{4}-\d{4})$/,
    message: '대표번호는 00-000-0000, 000-0000-0000, 00-0000-0000 형식으로 입력해 주세요.',
  },
  이메일: {
    pattern: /^[A-Za-z0-9._%+-]{1,20}@[a-z]+\.[a-z]{3}$/,
    message: 'example@email.com 등 알맞은 형식으로 입력해주세요.',
  },
  상세주소: {
    maxLength: 20,
    message: '상세주소는 20자 이하로 입력해 주세요.',
  },
  팩스번호: {
    maxLength: 13,
    pattern: /^(?:\d{2}-\d{3}-\d{4}|\d{3}-\d{4}-\d{4}|\d{2}-\d{4}-\d{4})$/,
    message: '팩스번호는 00-000-0000, 000-0000-0000, 00-0000-0000 형식으로 입력해 주세요.',
  },
};

const validateField = (label, value) => {
  const rule = validationRules[label];

  if (!rule) return '';
  if (rule.maxLength && value.length > rule.maxLength) return rule.message;
  if (rule.pattern && value && !rule.pattern.test(value)) return rule.message;

  return '';
};

const Field = ({ label, value, required, readOnly, onChange, error }) => (
  <label className="flex flex-col gap-2">
    <span className="text-sm font-bold text-slate-700">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </span>
    <input
      type="text"
      value={value}
      readOnly={readOnly}
      maxLength={validationRules[label]?.maxLength}
      onChange={(event) => onChange(label, event.target.value)}
      className={`h-12 w-full rounded-xl border px-4 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-300 ${
        error
          ? 'border-red-500 bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
          : readOnly
            ? 'border-slate-200 bg-slate-50 cursor-default'
            : 'border-slate-200 bg-white focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/10'
      }`}
    />
    {error && <span className="text-xs font-semibold text-red-500">{error}</span>}
  </label>
);

const AdminCompanyInfo = () => {
  const [formValues, setFormValues] = useState(initialFormValues);
  const [savedValues, setSavedValues] = useState(initialFormValues);
  const [isEditing, setIsEditing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (label, value) => {
    setFormValues((prev) => ({ ...prev, [label]: value }));
    setFieldErrors((prev) => {
      const error = validateField(label, value);
      const nextErrors = { ...prev };

      if (error) {
        nextErrors[label] = error;
      } else {
        delete nextErrors[label];
      }

      return nextErrors;
    });
  };

  const handleCancel = () => {
    setFormValues(savedValues);
    setFieldErrors({});
    setIsEditing(false);
  };

  const handleSave = () => {
    const nextErrors = Object.entries(formValues).reduce((acc, [label, value]) => {
      const error = validateField(label, value);
      return error ? { ...acc, [label]: error } : acc;
    }, {});

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSavedValues(formValues);
    setFieldErrors({});
    setIsEditing(false);
  };

  const handleEdit = () => {
    setFieldErrors({});
    setIsEditing(true);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#F6F8FC] p-6 md:p-8 lg:p-10">
      <div className="mx-auto flex max-w-[88rem] flex-col gap-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
                회사 정보 관리
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                회사 기본 정보를 등록하고 수정할 수 있습니다.
              </p>
            </div>

            {isEditing ? (
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 md:ml-auto">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
                  ...
                </span>
                <span>수정 중...</span>
              </div>
            ) : (
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 md:ml-auto">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span>저장 완료</span>
                <span className="font-semibold text-emerald-600">2024.05.20 14:32 · 정선경(Admin)</span>
              </div>
            )}
          </div>

          
        </header>

        <section className="space-y-6" aria-label="회사 정보 입력 폼">
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-lg font-extrabold text-slate-900">기본 정보</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-6">
              {companyFields[0].fields.map((field, index) => (
                <div
                  key={field.label}
                  className={index < 3 ? 'xl:col-span-2' : 'xl:col-span-3'}
                >
                  <Field
                    {...field}
                    value={formValues[field.label]}
                    readOnly={!isEditing}
                    onChange={handleChange}
                    error={fieldErrors[field.label]}
                  />
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-lg font-extrabold text-slate-900">주소 정보</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {companyFields[1].fields.map((field) => (
                <div key={field.label} className={field.wide ? 'md:col-span-2' : ''}>
                  <Field
                    {...field}
                    value={formValues[field.label]}
                    readOnly={!isEditing}
                    onChange={handleChange}
                    error={fieldErrors[field.label]}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  취소
                </button>
              )}
              <button
                type="button"
                onClick={isEditing ? handleSave : handleEdit}
                className="rounded-xl bg-[#3530B8] px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#3530B8]/20 transition-colors hover:bg-[#2A2696]"
              >
                {isEditing ? '수정 완료' : '수정'}
              </button>
            </div>
          </article>
        </section>

      </div>
    </main>
  );
};

export default AdminCompanyInfo;
