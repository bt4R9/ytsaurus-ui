import React from 'react';
import cn from 'bem-cn-lite';

import {TextInput, TextInputProps} from '@gravity-ui/uikit';
import {Tooltip} from '../../components/Tooltip/Tooltip';

import hammer from '../../common/hammer';

import {parseBytes} from '../../utils';
import {KeyCode} from '../../constants';
import './NumberInput.scss';

const block = cn('yt-number-input');

export function parseValue(rawValue: string, format: NumberInputProps['format']) {
    if (rawValue === '') {
        return undefined;
    }
    const skipSpaces = rawValue.replace(/\s/g, '');
    return format === 'Bytes' ? parseBytes(skipSpaces) : Number(skipSpaces);
}

export function formatValue(
    value: NumberInputProps['value'],
    format?: NumberInputProps['format'],
    settings?: object,
) {
    if (value === undefined) {
        return '';
    }

    const res =
        format === 'Bytes'
            ? hammer.format['Bytes'](value, settings)
            : hammer.format['Number'](value, settings);
    return res === hammer.format.NO_VALUE ? '' : res;
}

function toRawValue(value: NumberInputProps['value']) {
    return value === undefined ? '' : value;
}

export interface NumberInputWithErrorProps
    extends Omit<TextInputProps, 'value' | 'onChange' | 'theme' | 'error'> {
    className?: string;

    format?: 'Number' | 'Bytes'; // 'Number' by default
    decimalPlaces?: number;
    value: {
        value: number | undefined;
        error?: string;
    };

    onChange: (v: NumberInputWithErrorProps['value']) => void;
    onEnterKeyDown?: () => void;

    validator?: (v: NumberInputWithErrorProps['value']['value']) => string | undefined;
    min?: number;
    max?: number;
    showHint?: boolean;

    hidePrettyValue?: boolean;
    preciseInitialRawValue?: boolean;

    disabled?: boolean;
}

interface State {
    parsedValue?: number;
    parsedError?: string;
    rawValue?: string;
    formattedValue?: string;
    focused?: boolean;
}

export class NumberInputWithError extends React.Component<NumberInputWithErrorProps, State> {
    static defaultProps = {
        size: 'm',
        view: 'normal',
        hasClear: true,
    };

    static getDerivedStateFromProps(
        props: NumberInputWithErrorProps,
        state: State,
    ): Partial<State> | null {
        const {value, format, preciseInitialRawValue, decimalPlaces} = props;
        if (state.rawValue === undefined) {
            const formatted = formatValue(value?.value, format, {
                digits: decimalPlaces,
            });
            return {
                parsedValue: value?.value,
                parsedError: NumberInputWithError.errorFromValue(value, props),
                rawValue: preciseInitialRawValue ? toRawValue(value?.value) : formatted,
                formattedValue: formatted,
            };
        }

        return null;
    }

    static errorFromValue(v: NumberInputWithErrorProps['value'], props: NumberInputWithErrorProps) {
        const {validator = () => undefined, min, max} = props;
        const {value, error} = v || {};

        if (error) {
            return error;
        }

        if (value === undefined) {
            return undefined;
        }

        try {
            if (isNaN(value)) {
                return 'wrong format';
            }

            const error = validator(value);
            if (error) {
                return error;
            }
        } catch (error) {
            return String(error);
        }

        if (min !== undefined && value < min) {
            return `The value must be \u2265 ${min}`;
        }

        if (max !== undefined && value > max) {
            return `The value must be \u2264 ${max}`;
        }

        return undefined;
    }

    state: State = {parsedValue: NaN};

    parseValue(rawValue: string): number | undefined {
        return parseValue(rawValue, this.props.format);
    }

    format(value: NumberInputProps['value']) {
        const {format, decimalPlaces} = this.props;
        return formatValue(value, format, {digits: decimalPlaces});
    }

    onChange = (rawValue: string) => {
        const value = this.parseValue(rawValue);
        const error = NumberInputWithError.errorFromValue({value}, this.props);
        this.setState({
            parsedValue: value,
            parsedError: error,
            rawValue,
            formattedValue: this.format(value),
        });

        const {onChange} = this.props;
        onChange({value, error});
    };

    onBlur = () => {
        this.setState({focused: false});
    };

    onFocus = () => {
        this.setState({focused: true});
    };

    getRestProps() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {value, onChange, min, max, validator, format, ...rest} = this.props;
        return rest;
    }

    onKeyDown = (e: React.KeyboardEvent) => {
        if (e.keyCode === KeyCode.ENTER && this.props.onEnterKeyDown) {
            this.props.onEnterKeyDown();
        }
    };

    renderMinMaxHint() {
        const {min, max, showHint, size} = this.props;
        const showMin = !isNaN(min!);
        const showMax = !isNaN(max!);
        if (!showHint || (!showMin && !showMax)) {
            return null;
        }
        return (
            <div className={block('hint', {size})}>
                {showMin && (
                    <Tooltip content={String(min)} placement={'bottom'}>
                        min: <b>{this.format(min)}</b>
                    </Tooltip>
                )}
                {showMin && <> &nbsp; </>}
                {showMax && (
                    <Tooltip content={String(max)} placement={'bottom'}>
                        max: <b>{this.format(max)}</b>
                    </Tooltip>
                )}
            </div>
        );
    }

    renderPrettyValue() {
        const {size, hidePrettyValue} = this.props;
        const {formattedValue} = this.state;

        if (hidePrettyValue) {
            return null;
        }

        return <div className={block('pretty-value', {size})}>{formattedValue}&nbsp;</div>;
    }

    render() {
        const {value: propsValue, className, hidePrettyValue, showHint} = this.props;
        const {parsedError, rawValue, formattedValue, focused} = this.state;
        const rest = this.getRestProps();
        const {size, view, hasClear} = rest;

        const {error} = propsValue;

        const err = error || parsedError;

        const text = focused ? rawValue : formattedValue;

        return (
            <div className={block(null, className)}>
                <TextInput
                    {...rest}
                    error={err as any}
                    autoComplete={false}
                    onUpdate={this.onChange}
                    onKeyDown={this.onKeyDown}
                    hasClear={hasClear}
                    value={text}
                    size={size}
                    view={view}
                    onBlur={this.onBlur}
                    onFocus={this.onFocus}
                />
                {!err && (
                    <React.Fragment>
                        {showHint && (!focused || hidePrettyValue)
                            ? this.renderMinMaxHint()
                            : this.renderPrettyValue()}
                    </React.Fragment>
                )}
            </div>
        );
    }
}

export interface NumberInputProps extends Omit<NumberInputWithErrorProps, 'value' | 'onChange'> {
    value: number | undefined;
    onChange: (value: NumberInputProps['value']) => void;

    error?: string;
}

export default class NumberInput extends React.Component<NumberInputProps> {
    static format(
        value: NumberInputProps['value'],
        format?: NumberInputWithErrorProps['format'],
        settings?: object,
    ) {
        return formatValue(value, format, settings);
    }

    render() {
        const {
            value,
            error,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            onChange,
            ...rest
        } = this.props;

        return <NumberInputWithError {...rest} onChange={this.onChange} value={{value, error}} />;
    }

    onChange: NumberInputWithErrorProps['onChange'] = ({value}) => {
        this.props.onChange(value);
    };
}