import { useEffect, useRef, useState } from "react";

export const useForm = (config = {}, onSubmit) => {
  const getFormStateData = () => {
    let fd = {};
    for (let key in config.formState) {
      fd[key] = config.formState[key].value || "";
    }
    return fd;
  };
  const [stateChanged, setStateChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (
      Object.keys(errors).length === 0 &&
      isSubmitting &&
      typeof onSubmit === "function"
    ) {
      onSubmit(Object.assign({}, formData), stateChanged);
    }
  }, [errors, isSubmitting, formData, onSubmit, stateChanged]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    let _errors = {};

    for (let key in config.formState) {
      if (config.formState[key].required && !formData[key]) {
        _errors[key] = "required";
      }
    }
    console.log("errors", _errors);
    setErrors(_errors);
    setIsSubmitting(true);
  };
  const handleChange = (e) => {
    const key = e.target.name;
    const value =
      e.currentTarget.type === "file"
        ? e.currentTarget.files
        : e.currentTarget.value;
    setIsSubmitting(false);
    setStateChanged(true);
    if (config.formState[key]?.required && !value)
      setErrors({
        ...errors,
        [key]: "required",
      });
    else if (errors[key] === "required") {
      delete errors[key];
      setErrors(errors);
    }
    setFormData({
      ...(stateChanged ? formData : getFormStateData()),
      [key]: value,
    });
  };
  const reset = (formData) => {
    setStateChanged(true);
    setFormData(formData);
  };

  return {
    formData: stateChanged ? formData : getFormStateData(),
    errors,
    isSubmitting,
    stateChanged,
    handleChange,
    handleSubmit,
    reset,
  };
};
