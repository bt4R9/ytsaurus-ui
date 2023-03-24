import React from 'react';

import {useSelector} from 'react-redux';

import {getGlobalLoadState, isDeveloper, getAdminPages} from '../../../store/selectors/global';

import {LOADING_STATUS, Page} from '../../../constants/index';
import {Route, Switch} from 'react-router';
import SectionName from './SectionName';
import TabletTopRowContent from '../../../pages/tablet/TabletTopRowContent';
import TabletCellBundlesTopRowContent from '../../../pages/tablet_cell_bundles/TabletCellBundlesTopRowContent.connected';
import ChaosCellBundlesTopRowContent from '../../../pages/chaos_cell_bundles/ChaosCellBundlesTopRowContent.connected';
import AccountsTopRowContent from '../../../pages/accounts/Accounts/AccountsTopRowContent';
import SchedulingTopRowContent from '../../../pages/scheduling/Scheduling/SchedulingTopRowContent';
import NavigationTopRowContent from '../../../pages/navigation/Navigation/NavigationTopRowContent';
import SystemTopRowContent from '../../../pages/system/System/SystemTopRowContent';
import DashboardTopRowContent from '../../../pages/dashboard/Dashboard/DashboardTopRowContent';
import ComponentsTopRowContent from '../../../pages/components/Components/ComponentsTopRowContent';
import {makeExtraPageTopRowRoutes} from '../../../containers/ClusterPage/ExtraClusterPageRoutes';
import {QueryTrackerTopRow} from '../../../pages/query-tracker/QueryTrackerTopRow';

export default function TopRowContent() {
    const loadState = useSelector(getGlobalLoadState);
    const isAdmin = useSelector(isDeveloper);
    const adminPages = useSelector(getAdminPages);

    return loadState !== LOADING_STATUS.LOADED ? null : (
        <Switch>
            <Route path={`/:cluster/${Page.SYSTEM}`} component={SystemTopRowContent} />
            <Route path={`/:cluster/${Page.NAVIGATION}`} component={NavigationTopRowContent} />
            <Route path={`/:cluster/${Page.SCHEDULING}`} component={SchedulingTopRowContent} />
            <Route path={`/:cluster/${Page.ACCOUNTS}`} component={AccountsTopRowContent} />
            <Route path={`/:cluster/${Page.TABLET}/:id`} component={TabletTopRowContent} />
            <Route
                path={`/:cluster/${Page.TABLET_CELL_BUNDLES}`}
                component={TabletCellBundlesTopRowContent}
            />
            <Route
                path={`/:cluster/${Page.CHAOS_CELL_BUNDLES}`}
                component={ChaosCellBundlesTopRowContent}
            />
            <Route path={`/:cluster/${Page.DASHBOARD}`} component={DashboardTopRowContent} />
            <Route path={`/:cluster/${Page.COMPONENTS}`} component={ComponentsTopRowContent} />
            {(!adminPages.includes(Page.QUERIES) || isAdmin) && (
                <Route path={`/:cluster/${Page.QUERIES}`} component={QueryTrackerTopRow} />
            )}
            {makeExtraPageTopRowRoutes()}
            <Route path={'/:cluster/:page'} component={SectionName} />
        </Switch>
    );
}