import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { maxios } from '../../api/axiosConfig';
import { getCompanyInfo, insertCompanyInfo, updateCompanyInfo, updateCompanyStamp, updateCompanyWatermark } from './adminApi';

const companyFields = [
    {
        title: '기본 정보',
        fields: [
            { label: '회사명', value: '', required: true },
            { label: '대표자명', value: '', required: true },
            { label: '사업자등록번호', value: '', required: true },
            { label: '대표번호', value: '', required: true },
            { label: '팩스번호', value: '' },
            { label: '이메일', value: '', required: true },
        ],
    },
    {
        title: '주소 정보',
        fields: [
            {
                label: '대표주소',
                value: '',
                required: true,
                wide: true,
            },
            { label: '상세주소', value: '' },
        ],
    },
];

const initialFormValues = companyFields.flatMap(({ fields }) => fields).reduce(
    (acc, field) => ({ ...acc, [field.label]: field.value }),
    { 우편번호: '' }
);

const toFormValues = (data) => ({
    회사명: data.companyName || '',
    대표자명: data.ceoName || '',
    사업자등록번호: data.businessNumber || '',
    대표번호: data.companyTel || '',
    이메일: data.companyEmail || '',
    우편번호: data.companyZonecode || '',
    대표주소: data.companyAddress || '',
    상세주소: data.companyDetailAddr || '',
    팩스번호: data.companyFax || '',
});

const getCompanyStampSysname = (data) => (
    data?.officialsealSysname || ''
);

const getCompanyWatermarkSysname = (data) => (
    data?.officialmarkSysname || ''
);

const getCompanyStampUrl = (sysname) => {
    if (!sysname) return null;

    const token = sessionStorage.getItem('token');
    return `https://api.sukong.shop/file/profile/view?sysname=${sysname}&token=${token}`;
};

const uploadCompanyImageFile = (endpoint, file) => {
    const formData = new FormData();
    formData.append('file', file);

    return maxios.put(endpoint, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

const uploadCompanyStampFile = (file) => {
    return updateCompanyStamp(file);
};

const uploadCompanyWatermarkFile = (file) => {
    return updateCompanyWatermark(file);
};

const toPayload = (values, companySeq) => ({
    companySeq,
    companyName: values['회사명'],
    ceoName: values['대표자명'],
    businessNumber: values['사업자등록번호'],
    companyTel: values['대표번호'],
    companyEmail: values['이메일'],
    companyZonecode: values['우편번호'],
    companyAddress: values['대표주소'],
    companyDetailAddr: values['상세주소'],
    companyFax: values['팩스번호'],
});

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

const validateField = (label, value, required = false) => {
    const rule = validationRules[label];
    const safeValue = value || '';

    if (required && !safeValue.trim()) {
        return `${label}은(는) 필수 입력 항목입니다.`;
    }

    if (!rule) return '';

    if (rule.maxLength && safeValue.length > rule.maxLength) {
        return rule.message;
    }

    if (rule.pattern && safeValue && !rule.pattern.test(safeValue)) {
        return rule.message;
    }

    return '';
};

const Field = ({ label, value, required, readOnly, onChange, error, action }) => (
    <label className="flex flex-col gap-2">
        <span className="text-sm font-bold text-slate-700">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
        </span>
        <div className="flex flex-col gap-2 sm:flex-row">
            <input
                type="text"
                value={value}
                readOnly={readOnly}
                maxLength={validationRules[label]?.maxLength}
                onChange={(event) => onChange(label, event.target.value)}
                className={`h-12 w-full rounded-xl border px-4 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-300 ${error
                    ? 'border-red-500 bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                    : readOnly
                        ? 'border-slate-200 bg-slate-50 cursor-default'
                        : 'border-slate-200 bg-white focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/10'
                    }`}
            />
            {action}
        </div>
        {error && <span className="text-xs font-semibold text-red-500">{error}</span>}
    </label>
);

const CompanyImageBox = ({ title, image, tempImage, isEditing, inputRef, onChange, emptyText, altText }) => (
    <div className="flex min-w-0 flex-none flex-col items-center justify-center">
        <span className="mb-3 text-sm font-bold text-slate-700">{title}</span>
        <button
            type="button"
            onClick={() => {
                if (isEditing) inputRef.current?.click();
            }}
            className={`flex h-50 w-50 items-center justify-center overflow-hidden rounded-lg bg-slate-50 transition-colors ${isEditing
                ? 'cursor-pointer border-2 border-dashed border-slate-300 hover:bg-[#F0F4FF]'
                : 'cursor-default border border-slate-200'
                }`}
        >
            {isEditing ? (
                tempImage ? (
                    <img src={tempImage} alt={`${title} 임시 이미지`} className="h-46 w-46 object-contain" />
                ) : (
                    <span className="flex flex-col items-center text-xs font-bold text-slate-400">
                        <span className="text-2xl leading-none">+</span>
                        <span className="mt-1">{emptyText}</span>
                    </span>
                )
            ) : image ? (
                <img src={image} alt={altText} className="h-56 w-56 object-contain" />
            ) : (
                <span className="text-xs font-semibold text-slate-400">미등록</span>
            )}
        </button>
        {isEditing && (
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-3 rounded-md bg-[#F0F4FF] px-3 py-1.5 text-xs font-extrabold text-[#3530B8] transition-colors hover:bg-[#E3E8FF]"
            >
                변경
            </button>
        )}
        <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onChange}
            className="hidden"
        />
    </div>
);


const AdminCompanyInfo = () => {
    const [formValues, setFormValues] = useState(initialFormValues);
    const [savedValues, setSavedValues] = useState(initialFormValues);
    const [isEditing, setIsEditing] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [companySeq, setCompanySeq] = useState(null);
    const [companyStamp, setCompanyStamp] = useState(null);
    const [tempCompanyStamp, setTempCompanyStamp] = useState(null);
    const [companyStampFile, setCompanyStampFile] = useState(null);
    const [companyWatermark, setCompanyWatermark] = useState(null);
    const [tempCompanyWatermark, setTempCompanyWatermark] = useState(null);
    const [companyWatermarkFile, setCompanyWatermarkFile] = useState(null);
    const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
    const postcodeRef = useRef(null);
    const companyStampInputRef = useRef(null);
    const companyWatermarkInputRef = useRef(null);

    useEffect(() => {
        const loadCompanyInfo = async () => {
            try {
                const resp = await getCompanyInfo();

                if (!resp.data) {
                    return;
                }

                const data = resp.data;

                setCompanySeq(data.companySeq);

                const nextFormValues = toFormValues(data);

                setFormValues(nextFormValues);
                setSavedValues(nextFormValues);
                const stampUrl = getCompanyStampUrl(getCompanyStampSysname(data));
                const watermarkUrl = getCompanyStampUrl(getCompanyWatermarkSysname(data));
                setCompanyStamp(stampUrl);
                setTempCompanyStamp(stampUrl);
                setCompanyWatermark(watermarkUrl);
                setTempCompanyWatermark(watermarkUrl);
            } catch (error) {
                console.log('회사 정보 조회 실패', error);
            }
        };

        loadCompanyInfo();
    }, []);

    useEffect(() => {
        if (!isPostcodeOpen || !postcodeRef.current) return;

        const Postcode = window.kakao?.Postcode || window.daum?.Postcode;

        if (!Postcode) {
            alert('주소 검색 API를 불러오지 못했습니다.');
            setIsPostcodeOpen(false);
            return;
        }

        new Postcode({
            width: '100%',
            height: '100%',
            oncomplete: (data) => {
                const selectedAddress = data.roadAddress || data.jibunAddress || '';

                setFormValues((prev) => ({
                    ...prev,
                    우편번호: data.zonecode || '',
                    대표주소: selectedAddress,
                }));
                setFieldErrors((prev) => {
                    const nextErrors = { ...prev };
                    delete nextErrors.대표주소;
                    return nextErrors;
                });
                setIsPostcodeOpen(false);
            },
        }).embed(postcodeRef.current);
    }, [isPostcodeOpen]);

    useEffect(() => {
        if (isEditing) {
            setTempCompanyStamp(companyStamp);
            setCompanyStampFile(null);
            setTempCompanyWatermark(companyWatermark);
            setCompanyWatermarkFile(null);
        }
    }, [isEditing, companyStamp, companyWatermark]);

    const handleChange = (label, value) => {
        setFormValues((prev) => ({ ...prev, [label]: value }));
        setFieldErrors((prev) => {
            const field = companyFields
                .flatMap(({ fields }) => fields)
                .find((field) => field.label === label);

            const error = validateField(label, value, field?.required);
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
        setTempCompanyStamp(companyStamp);
        setCompanyStampFile(null);
        setTempCompanyWatermark(companyWatermark);
        setCompanyWatermarkFile(null);
        setFieldErrors({});
        setIsEditing(false);
    };

    const handleCompanyImageChange = (event, setFile, setTempImage) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 등록할 수 있습니다.');
            event.target.value = '';
            return;
        }

        setFile(file);

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            setTempImage(readerEvent.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleCompanyStampChange = (event) => {
        handleCompanyImageChange(event, setCompanyStampFile, setTempCompanyStamp);
    };

    const handleCompanyWatermarkChange = (event) => {
        handleCompanyImageChange(event, setCompanyWatermarkFile, setTempCompanyWatermark);
    };

    const handleSave = async () => {
        const requiredMap = companyFields
            .flatMap(({ fields }) => fields)
            .reduce((acc, field) => {
                acc[field.label] = field.required;
                return acc;
            }, {});

        const nextErrors = Object.entries(formValues).reduce((acc, [label, value]) => {
            const error = validateField(label, value, requiredMap[label]);
            return error ? { ...acc, [label]: error } : acc;
        }, {});

        if (Object.keys(nextErrors).length > 0) {
            setFieldErrors(nextErrors);
            return;
        }

        try {
            const payload = toPayload(formValues, companySeq);

            if (companySeq) {
                await updateCompanyInfo(payload);
            } else {
                await insertCompanyInfo(payload);
            }

            if (companyStampFile) {
                await uploadCompanyStampFile(companyStampFile);
            }

            if (companyWatermarkFile) {
                await uploadCompanyWatermarkFile(companyWatermarkFile);
            }

            const resp = await getCompanyInfo();

            if (resp.data) {
                const data = resp.data;
                const nextFormValues = toFormValues(data);
                const stampUrl = getCompanyStampUrl(getCompanyStampSysname(data));
                const watermarkUrl = getCompanyStampUrl(getCompanyWatermarkSysname(data));

                setCompanySeq(data.companySeq);
                setFormValues(nextFormValues);
                setSavedValues(nextFormValues);
                setCompanyStamp(stampUrl);
                setTempCompanyStamp(stampUrl);
                setCompanyWatermark(watermarkUrl);
                setTempCompanyWatermark(watermarkUrl);
            } else {
                setSavedValues(formValues);
                setCompanyStamp(tempCompanyStamp);
                setCompanyWatermark(tempCompanyWatermark);
            }

            setCompanyStampFile(null);
            setCompanyWatermarkFile(null);
            setFieldErrors({});
            setIsEditing(false);
        } catch (error) {
            alert('회사 정보 저장 중 오류가 발생했습니다.');
        }
    };

    const handleEdit = () => {
        setFieldErrors({});
        setIsEditing(true);
    };

    return (
        <main className="flex-1 overflow-y-auto bg-[#FFFFFF] p-6 md:p-8 lg:p-10">
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
                    </div>


                </header>

                <section className="space-y-6" aria-label="회사 정보 입력 폼">
                    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                        <h2 className="mb-6 text-lg font-extrabold text-slate-900">기본 정보</h2>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12">
                            {companyFields[0].fields.map((field) => (
                                <div
                                    key={field.label}
                                    className={
                                        ['회사명', '대표자명', '사업자등록번호'].includes(field.label)
                                            ? 'xl:col-span-4'
                                            : ['대표번호', '팩스번호'].includes(field.label)
                                                ? 'xl:col-span-3'
                                                : 'xl:col-span-6'
                                    }
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
                        <h2 className="mb-6 text-lg font-extrabold text-slate-900">사업장 및 서식 정보</h2>
                        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:gap-0">
                            <div className="flex max-w-2xl flex-col gap-5 xl:pr-8">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[9rem_8rem]">
                                    <Field
                                        label="우편번호"
                                        value={formValues['우편번호']}
                                        readOnly
                                        onChange={handleChange}
                                    />
                                    {isEditing && (
                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                onClick={() => setIsPostcodeOpen(true)}
                                                className="h-12 w-full rounded-xl border border-[#3530B8] bg-white px-4 text-sm font-extrabold text-[#3530B8] transition-colors hover:bg-[#F0F4FF]"
                                            >
                                                주소 검색
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <Field
                                    label="대표주소"
                                    value={formValues['대표주소']}
                                    required
                                    readOnly
                                    onChange={handleChange}
                                    error={fieldErrors['대표주소']}
                                />
                                <Field
                                    label="상세주소"
                                    value={formValues['상세주소']}
                                    readOnly={!isEditing}
                                    onChange={handleChange}
                                    error={fieldErrors['상세주소']}
                                />
                            </div>

                            <div className="flex flex-col items-center justify-center gap-20 border-t border-slate-200 pt-6 sm:flex-row xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
                                <CompanyImageBox
                                    title="워터마크"
                                    image={companyWatermark}
                                    tempImage={tempCompanyWatermark}
                                    isEditing={isEditing}
                                    inputRef={companyWatermarkInputRef}
                                    onChange={handleCompanyWatermarkChange}
                                    emptyText="워터마크 등록"
                                    altText="회사 워터마크"
                                />
                                <CompanyImageBox
                                    title="회사 직인"
                                    image={companyStamp}
                                    tempImage={tempCompanyStamp}
                                    isEditing={isEditing}
                                    inputRef={companyStampInputRef}
                                    onChange={handleCompanyStampChange}
                                    emptyText="직인 등록"
                                    altText="회사 직인"
                                />
                            </div>
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

                {isPostcodeOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="relative h-[31.25rem] w-full max-w-[31.25rem] overflow-hidden rounded-2xl bg-white shadow-2xl">
                            <button
                                type="button"
                                onClick={() => setIsPostcodeOpen(false)}
                                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-500 shadow hover:bg-slate-50"
                            >
                                ×
                            </button>
                            <div ref={postcodeRef} className="h-full w-full" />
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
};

export default AdminCompanyInfo;
