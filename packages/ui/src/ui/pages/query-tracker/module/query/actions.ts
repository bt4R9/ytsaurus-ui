import {createQueryUrl} from '../../utils/navigation';
import {Action} from 'redux';
import {ThunkAction} from 'redux-thunk';
import {RootState} from '../../../../store/reducers';
import {getCluster} from '../../../../store/selectors/global';
import {ActionD} from '../../../../types';
import {getQuery, QueryItem, abortQuery, QueryEngine, startQuery} from '../api';
import {requestQueriesList} from '../queries_list/actions';
import {getCurrentQuery, getQueryDraft} from './selectors';
import {getAppBrowserHistory} from '../../../../store/window-store';
import {QueryState} from './reducer';
import {wrapApiPromiseByToaster} from '../../../../utils/utils';

export const REQUEST_QUERY = 'query-tracker/REQUEST_QUERY';
export type RequestQueryAction = Action<typeof REQUEST_QUERY>;

export const SET_QUERY = 'query-tracker/SET_QUERY';
export type SetQueryAction = ActionD<
    typeof SET_QUERY,
    {
        initialQuery?: QueryItem;
    }
>;

export const UPDATE_QUERY = 'query-tracker/UPDATE_QUERY';
export type UpdateQueryAction = ActionD<typeof UPDATE_QUERY, QueryItem>;

export const SET_QUERY_LOAD_ERROR = 'query-tracker/SET_QUERY_LOAD_ERROR';
export type SetQueryErrorLoadAction = ActionD<typeof SET_QUERY_LOAD_ERROR, Error | string>;

export const SET_QUERY_PATCH = 'query-tracker/SET_QUERY_PATCH';
export type SetQueryPatchAction = ActionD<typeof SET_QUERY_PATCH, Pick<QueryState, 'draft'>>;

export function loadQuery(
    queryId: string,
): ThunkAction<any, RootState, any, SetQueryAction | RequestQueryAction | SetQueryErrorLoadAction> {
    return async (dispatch) => {
        dispatch({type: REQUEST_QUERY});
        try {
            const query = await wrapApiPromiseByToaster(getQuery(queryId), {
                toasterName: 'load_query',
                skipSuccessToast: true,
                errorTitle: 'Failed to load query',
            });
            dispatch({
                type: SET_QUERY,
                data: {
                    initialQuery: query,
                },
            });
        } catch (e: unknown) {
            dispatch(createEmptyQuery());
        }
    };
}

export function createEmptyQuery(
    engine = QueryEngine.YQL,
    query?: string,
): ThunkAction<any, RootState, any, SetQueryAction> {
    return (dispatch) => {
        dispatch({
            type: SET_QUERY,
            data: {
                initialQuery: {
                    query: query || '',
                    engine,
                    settings: {},
                } as QueryItem,
            },
        });
    };
}

export function runQuery(): ThunkAction<any, RootState, any, SetQueryAction> {
    return async (dispatch, getState) => {
        const state = getState();
        const query = getQueryDraft(state);
        const {query_id} = await wrapApiPromiseByToaster(startQuery(query), {
            toasterName: 'start_query',
            skipSuccessToast: true,
            errorTitle: 'Failed to start query',
        });
        dispatch(goToQuery(query_id));
        dispatch(requestQueriesList());
    };
}

export function abortCurrentQuery(): ThunkAction<any, RootState, any, SetQueryAction> {
    return async (dispatch, getState) => {
        const state = getState();
        const currentQuery = getCurrentQuery(state);
        if (currentQuery) {
            await wrapApiPromiseByToaster(abortQuery(currentQuery?.id), {
                toasterName: 'abort_query',
                skipSuccessToast: true,
                errorTitle: 'Failed to abort query',
            });
            dispatch(loadQuery(currentQuery?.id));
            dispatch(requestQueriesList());
        }
    };
}

export function goToQuery(query_id: string): ThunkAction<any, RootState, any, never> {
    return (_, getState) => {
        const state = getState();
        const cluster = getCluster(state);
        const history = getAppBrowserHistory();
        history.push(createQueryUrl(cluster, query_id));
    };
}