import axios, {AxiosError} from 'axios';
import _ from 'lodash';
import * as os from 'os';

import type {Request} from 'express';

import {ClusterConfig} from '../../shared/yt-types';
import {YTApiUserSetup} from './requestsSetup';

const REQUEST_TIMEOUT = 15000;

function getExtra(error: AxiosError) {
    const {headers} = error?.request?._options || {};
    if (headers) {
        const correlationId = headers['X-YT-Correlation-Id'];
        return correlationId && {'X-YT-Correlation-Id': correlationId};
    }
    return undefined;
}

export async function getXSRFToken(req: Request, config: YTApiUserSetup, actionPrefix = '') {
    const timeStart = Date.now();
    const {setup, proxyBaseUrl, authHeaders} = config;

    const xYTCorrelationId = `${req.id}.getXSRFToken`;

    function sendStats(responseStatus: number) {
        const timestamp = Date.now();
        req.ctx.log('getXSRFToken', {
            xYTCorrelationId,
            responseStatus,
        });

        // @ts-expect-error
        req.ctx.stats?.('ytRequests', {
            responseStatus,
            headerContentLength: 0,
            timestamp,
            host: os.hostname(),
            service: setup.id,
            requestTime: timestamp - timeStart,
            requestId: req.id,
            action: `${actionPrefix}.getXSRFToken`,
            referer: req?.headers?.referer || '',
            page: '',
        });
    }

    return axios
        .request<{login: string; csrf_token: string}>({
            url: proxyBaseUrl + '/auth/whoami',
            method: 'GET',
            headers: {
                ...authHeaders,
                'X-YT-Correlation-Id': xYTCorrelationId,
            },
            timeout: REQUEST_TIMEOUT,
        })
        .then((response) => {
            sendStats(response.status);
            return response.data;
        })
        .catch((e) => {
            sendStats(e?.response?.status ?? 500);
            return Promise.reject(e);
        });
}

function getVersion(clusterConfig: {proxy: string; secure?: boolean}) {
    const {proxy, secure} = clusterConfig;
    const protocol = secure ? 'https://' : 'http://';

    return axios
        .request({
            url: protocol + proxy + '/version',
            method: 'GET',
            timeout: REQUEST_TIMEOUT,
            responseType: 'text',
        })
        .then((response) => response.data);
}

function parseVersion(version: string) {
    const match = version && version.match(/(\d+)\.(\d+)\.(\d+)/);
    return match && match[0];
}

export function getVersions(req: Request, clusters: Record<string, ClusterConfig>) {
    return Promise.all(
        _.map(clusters, (clusterConfig) => {
            const id = clusterConfig.id;
            return getVersion(clusterConfig)
                .then((version) => ({id, version: parseVersion(version)}))
                .catch((error) => {
                    req.ctx.logError('getVersion error', error, getExtra(error));
                    return {id};
                });
        }),
    );
}

function prepareError(message: string, err: AxiosError) {
    let error;
    let http_status_code;
    try {
        if (err?.isAxiosError) {
            error = err.response?.data;
            http_status_code = err.response?.status;
        } else {
            error = err;
        }
    } catch {
        error = err;
    }
    return {
        message: `${message}:${_.toString(err)}`,
        code: http_status_code,
        inner_errors: _.compact([error]),
    };
}

export async function getClusterInfo(req: Request, config: YTApiUserSetup) {
    const {setup} = config;
    const tokenPromise = getXSRFToken(req, config, 'ui_clusterInfo');
    const clusterVersionPromise = getVersion(setup);

    let tokenError, versionError;
    let token,
        version = null;
    try {
        version = await clusterVersionPromise;
    } catch (err: any) {
        versionError = prepareError('Failed to get cluster version ', err);
        req.ctx.logError('Failed to get cluster version: ' + err.toString(), err, getExtra(err));
    }

    try {
        token = await tokenPromise;
    } catch (err: any) {
        tokenError = prepareError('Failed to get XSRF token ', err);
        req.ctx.logError('Failed to get XSRF token', err, getExtra(err));
    }

    return {
        token,
        version,
        tokenError,
        versionError,
    };
}