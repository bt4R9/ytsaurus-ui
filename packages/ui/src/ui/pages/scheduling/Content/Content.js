import React from 'react';
import PropTypes from 'prop-types';
import {useSelector} from 'react-redux';
import {Route, Switch, Redirect, withRouter} from 'react-router';
import cn from 'bem-cn-lite';
import _ from 'lodash';

import Tabs from '../../../components/Tabs/Tabs';
import Placeholder from '../../../pages/components/Placeholder';
import {OverviewWithRum} from '../../../pages/scheduling/Content/tabs/Overview/Overview';
import Details from '../../../pages/scheduling/Content/tabs/Details/Details';
import ErrorBoundary from '../../../components/ErrorBoundary/ErrorBoundary';

import {Tab, DEFAULT_TAB, SCHEDULING_ALLOWED_ROOT_TABS} from '../../../constants/scheduling';
import PoolAcl from '../../../pages/scheduling/Content/tabs/PoolAcl/PoolAcl';
import {
    getTree,
    getPool,
    isPoolAclAllowed,
    getIsRoot,
    getPoolIsEphemeral,
} from '../../../store/selectors/scheduling/scheduling';
import {makeTabProps} from '../../../utils';

import './Content.scss';
import {getUISizes, getCluster} from '../../../store/selectors/global';
import SchedulingOperationsUpdater from './SchedulingOperationsUpdater';
import UIFactory from '../../../UIFactory';

const block = cn('scheduling-content');

Content.propTypes = {
    // from parent
    className: PropTypes.string,
    // from react-router
    match: PropTypes.shape({
        path: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
    }).isRequired,
    location: PropTypes.shape({
        search: PropTypes.string.isRequired,
    }).isRequired,
};

function Content({className, match, location}) {
    const cluster = useSelector(getCluster);
    const pool = useSelector(getPool);
    const tree = useSelector(getTree);
    const isEphemeral = useSelector(getPoolIsEphemeral);
    const isRoot = useSelector(getIsRoot);
    const allowAcl = useSelector(isPoolAclAllowed);

    const localTab = {...Tab};

    const showSettings = _.reduce(
        Tab,
        (acc, tab) => {
            acc[tab] = {show: SCHEDULING_ALLOWED_ROOT_TABS[tab] || !isRoot};
            return acc;
        },
        {},
    );

    const titleDict = {};

    const aclTab = showSettings[Tab.ACL];
    aclTab.show = aclTab.show && allowAcl;

    const extraTabs = UIFactory.getSchedulingExtraTabs({
        cluster,
        pool,
        tree,
        extraOptions: {isRoot, isEphemeral},
    });

    const extraRoutes = [];

    extraTabs.forEach((tab) => {
        const {name, title, component} = tab;
        showSettings[name] = {show: true};
        localTab[name] = name;
        if (title) {
            titleDict[name] = title;
        }
        const route = <Route key={name} path={`${match.path}/${name}`} component={component} />;
        extraRoutes.push(route);
    });

    delete localTab.ACL;
    localTab[Tab.ACL] = Tab.ACL;

    const props = makeTabProps(match.url, localTab, showSettings, {pool, tree}, titleDict);

    const tabSize = useSelector(getUISizes).tabSize;

    return (
        <ErrorBoundary>
            <SchedulingOperationsUpdater />
            <div className={block(null, className)}>
                <Tabs
                    {...props}
                    active={DEFAULT_TAB}
                    className={block('tabs')}
                    routed
                    size={tabSize}
                />

                <Switch>
                    <Route path={`${match.path}/${Tab.OVERVIEW}`} component={OverviewWithRum} />
                    <Route path={`${match.path}/${Tab.DETAILS}`} component={Details} />
                    {extraRoutes}
                    {aclTab.show && <Route path={`${match.path}/${Tab.ACL}`} component={PoolAcl} />}
                    <Route path={`${match.path}/:tab`} component={Placeholder} />
                    <Redirect
                        from={match.url}
                        to={{pathname: `${match.url}/${DEFAULT_TAB}`, search: location.search}}
                    />
                </Switch>
            </div>
        </ErrorBoundary>
    );
}

export default withRouter(Content);