import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import { withTranslation } from 'react-i18next';
import { CopyToClipboard } from 'react-copy-to-clipboard';

// TODO: GW-333
// import Panel from 'react-bootstrap/es/Panel';
import {
  UncontrolledTooltip, Collapse, Button, Card, CardBody, CardHeader,
} from 'reactstrap';

import { createSubscribedElement } from '../UnstatedUtils';
import AppContainer from '../../services/AppContainer';

import RevisionBody from '../Page/RevisionBody';

class Draft extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      html: '',
      isRendered: false,
      isPanelExpanded: false,
      showCopiedMessage: false,
    };

    this.growiRenderer = this.props.appContainer.getRenderer('draft');

    this.changeToolTipLabel = this.changeToolTipLabel.bind(this);
    this.expandPanelHandler = this.expandPanelHandler.bind(this);
    this.collapsePanelHandler = this.collapsePanelHandler.bind(this);
    this.renderHtml = this.renderHtml.bind(this);
    this.renderAccordionTitle = this.renderAccordionTitle.bind(this);
    this.collapseCardHandler = this.collapseCardHandler.bind(this);
  }

  changeToolTipLabel() {
    this.setState({ showCopiedMessage: true });
    setTimeout(() => {
      this.setState({ showCopiedMessage: false });
    }, 1000);
  }

  expandPanelHandler() {
    this.setState({ isPanelExpanded: true });

    if (!this.state.isRendered) {
      this.renderHtml();
    }
  }

  collapsePanelHandler() {
    this.setState({ isPanelExpanded: false });
  }

  async renderHtml() {
    const context = {
      markdown: this.props.markdown,
    };

    const growiRenderer = this.growiRenderer;
    const interceptorManager = this.props.appContainer.interceptorManager;
    await interceptorManager.process('prePreProcess', context)
      .then(() => {
        context.markdown = growiRenderer.preProcess(context.markdown);
      })
      .then(() => { return interceptorManager.process('postPreProcess', context) })
      .then(() => {
        const parsedHTML = growiRenderer.process(context.markdown);
        context.parsedHTML = parsedHTML;
      })
      .then(() => { return interceptorManager.process('prePostProcess', context) })
      .then(() => {
        context.parsedHTML = growiRenderer.postProcess(context.parsedHTML);
      })
      .then(() => { return interceptorManager.process('postPostProcess', context) })
      .then(() => {
        this.setState({ html: context.parsedHTML, isRendered: true });
      });
  }

  renderAccordionTitle(isExist) {
    const iconClass = this.state.isPanelExpanded ? 'caret-opened' : '';

    return (
      <Fragment>
        <i className={`caret ${iconClass}`}></i>
        <span className="mx-2">{this.props.path}</span>
        { isExist && (
          <span>({this.props.t('page exists')})</span>
        ) }
        { !isExist && (
          <span className="badge-draft badge badge-pill badge-secondary">draft</span>
        ) }
      </Fragment>
    );
  }

  collapseCardHandler() {
    // this.setState({ collapse: false, setCollapse: false, setStatus: 'Closed' });
  }

  render() {
    const { t } = this.props;

    return (
      <div className="draft-list-item">
        <Card className="accordion" id="accordionMyDraft">
          <CardHeader className="d-flex" id="headerMyDraft">
            <Button
              className="btn btn-link py-0"
              type="button"
              data-toggle="collapse"
              data-target="#collapseMyDraft"
              aria-expanded="true"
              aria-controls="collapseMyDraft"
            >
              {this.renderAccordionTitle(this.props.isExist)}
            </Button>
            <a href={this.props.path}><i className="icon icon-login"></i></a>
            <div className="flex-grow-1"></div>
            <div className="icon-container">
              {this.props.isExist
                ? null
                : (
                  <a
                    href={`${this.props.path}#edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-toggle="tooltip"
                    title={this.props.t('Edit')}
                  >
                    <i className="mx-2 icon-note" />
                  </a>
                )
              }
              <span id="draft-copied-tooltip">
                <CopyToClipboard text={this.props.markdown} onCopy={this.changeToolTipLabel}>
                  <a
                    className="text-center draft-copy"
                  >
                    <i className="mx-2 ti-clipboard" />
                  </a>
                </CopyToClipboard>
              </span>
              <UncontrolledTooltip placement="top" target="draft-copied-tooltip">
                { this.state.showCopiedMessage && (
                  <strong>copied!</strong>
                ) }
                { !this.state.showCopiedMessage && (
                  <span>{this.props.t('Copy')}</span>
                ) }
              </UncontrolledTooltip>
              <a
                className="text-danger text-center"
                data-toggle="tooltip"
                data-placement="top"
                title={t('Delete')}
                onClick={() => { return this.props.clearDraft(this.props.path) }}
              >
                <i className="mx-2 icon-trash" />
              </a>
            </div>
          </CardHeader>
          <Collapse
            id="collapseMyDraft"
            className="collapse"
            aria-labelledby="headerMyDraft"
            data-parent="#accordionMyDraft"
            isOpen={this.state.isPanelExpanded}
            onEntering={this.expandPanelHandler}
            onExiting={this.collapsePanelHandler}
          >
            <CardBody>
              {/* loading spinner */}
              { this.state.isPanelExpanded && !this.state.isRendered && (
                <div className="text-center">
                  <i className="fa fa-lg fa-spinner fa-pulse mx-auto text-muted"></i>
                </div>
              ) }
              {/* contents */}
              { this.state.isPanelExpanded && this.state.isRendered && (
                <RevisionBody html={this.state.html} />
              ) }
            </CardBody>
          </Collapse>
        </Card>
      </div>
    );
  }

}

/**
 * Wrapper component for using unstated
 */
const DraftWrapper = (props) => {
  return createSubscribedElement(Draft, props, [AppContainer]);
};


Draft.propTypes = {
  t: PropTypes.func.isRequired,
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,

  path: PropTypes.string.isRequired,
  markdown: PropTypes.string.isRequired,
  isExist: PropTypes.bool.isRequired,
  clearDraft: PropTypes.func.isRequired,
};

export default withTranslation()(DraftWrapper);
