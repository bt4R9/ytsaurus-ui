import React, {useCallback, useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import cn from 'bem-cn-lite';
import _ from 'lodash';

import LoadDataHandler from '../../../components/LoadDataHandler/LoadDataHandler';
import {Loader, Dialog as DeleteDialog} from '@gravity-ui/uikit';
import ErrorBoundary from '../../../components/ErrorBoundary/ErrorBoundary';
import Error from '../../../components/Error/Error';

import Content from '../Content/Content';
import Alerts from '../Alerts';

import {SCHEDULING_CREATE_POOL_CANCELLED} from '../../../constants/scheduling';
import Updater from '../../../utils/hammer/updater';
import {
    loadSchedulingData,
    abortAndReset,
    closeDeleteModal,
    deletePool,
} from '../../../store/actions/scheduling/scheduling';

import './Scheduling.scss';
import {useAppRumMeasureStart} from '../../../rum/rum-app-measures';
import {RumMeasureTypes} from '../../../rum/rum-measure-types';
import {getSchedulingIsFinalLoadingState} from '../../../store/selectors/scheduling';
import SchedulingResources from '../Content/SchedulingResources';
import {PoolEditorDialog} from './PoolEditorDialog/PoolEditorDialog';
import {RootState} from '../../../store/reducers';

const updater = new Updater();
const block = cn('scheduling');

const SchedulingDialogsMemo = React.memo(SchedulingDialogs);

function Scheduling() {
    const {loading, loaded, error, errorData} = useSelector((state: RootState) => state.scheduling);
    const initialLoading = loading && !loaded;
    const dispatch = useDispatch();

    const loadHandler = () => dispatch(loadSchedulingData());

    useEffect(() => {
        updater.add('scheduling', loadHandler, 30 * 1000);

        return () => {
            updater.remove('scheduling');
            dispatch(abortAndReset());
        };
    }, [dispatch]);

    return (
        <div className={block(null, 'elements-main-section')}>
            <ErrorBoundary>
                <div className={block('wrapper', {loading: initialLoading})}>
                    {initialLoading ? (
                        <Loader />
                    ) : (
                        <LoadDataHandler loaded={loaded} error={error} errorData={errorData}>
                            <Alerts className={block('alerts')} />
                            <SchedulingResources />
                            <Content {...{className: block('content')}} />
                        </LoadDataHandler>
                    )}
                </div>
                <SchedulingDialogsMemo />
            </ErrorBoundary>
        </div>
    );
}

const SchedulingMemo = React.memo(Scheduling);

export default function SchedulingWithRum() {
    const isFinalState = useSelector(getSchedulingIsFinalLoadingState);

    useAppRumMeasureStart({
        type: RumMeasureTypes.SCHEDULING,
        startDeps: [isFinalState],
        allowStart: ([isFinal]) => {
            return !isFinal;
        },
    });

    return <SchedulingMemo />;
}

function SchedulingDialogs() {
    const dispatch = useDispatch();

    const {deleteVisibility, deleteItem, poolErrorData} = useSelector(
        (state: RootState) => state.scheduling,
    );

    const deleteConfirmHandler = useCallback(
        () => dispatch(deletePool(deleteItem)),
        [deleteItem, dispatch],
    );
    const deleteCloseHandler = useCallback(() => {
        dispatch({type: SCHEDULING_CREATE_POOL_CANCELLED});
        dispatch(closeDeleteModal());
    }, [dispatch]);

    return (
        <React.Fragment>
            {deleteVisibility && (
                <DeleteDialog
                    size="m"
                    className={block('delete-dialog')}
                    open={deleteVisibility}
                    onClose={deleteCloseHandler}
                    hasCloseButton
                >
                    <DeleteDialog.Header caption="Delete" />
                    <DeleteDialog.Body>
                        Are you sure you want to delete the <b>{deleteItem?.name}</b> pool?
                        {_.keys(poolErrorData).length > 0 ? (
                            <Error message="Delete pool failure" error={poolErrorData} />
                        ) : null}
                    </DeleteDialog.Body>
                    <DeleteDialog.Footer
                        onClickButtonApply={deleteConfirmHandler}
                        onClickButtonCancel={deleteCloseHandler}
                        propsButtonApply={{view: 'flat-danger'}}
                        textButtonCancel="Cancel"
                        textButtonApply="Delete"
                    />
                </DeleteDialog>
            )}
            <PoolEditorDialog />
        </React.Fragment>
    );
}