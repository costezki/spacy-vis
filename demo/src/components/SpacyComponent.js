import React from 'react';
import { API_ROOT } from '../api-config';
import { withRouter } from 'react-router-dom';
import { PaneTop, PaneBottom } from './Pane'
import Button from './Button'
import ModelIntro from './ModelIntro'
import { Tree } from 'hierplane';

/*******************************************************************************
  <SpacyParserInput /> Component
*******************************************************************************/

const demoSentences = [
  "Pierre Vinken died aged 81; immortalised aged 61.",
  "James went to the corner shop to buy some eggs, milk and bread for breakfast.",
  "If you bring $10 with you tomorrow, can you pay for me to eat too?",
  "True self-control is waiting until the movie starts to eat your popcorn.",
];

const spacyModels = [
  'en_core_web_sm',
  'de_core_news_sm',
  'es_core_news_sm',
  'pt_core_news_sm',
  'fr_core_news_sm',
  'it_core_news_sm',
  'nl_core_news_sm',
];

const title = "Spacy Visualizer";
const description = (
  <span>
    <span>
      A visualiser for Spacy annotations. This visualisation uses the
    </span>
    <a href="https://allenai.github.io/hierplane/" target="_blank" rel="noopener noreferrer">{' '} Hierplane Library </a>
    <span>
      to render the dependency parse from Spacy's models. It also includes visualisation of entities and POS tags within nodes.
    </span>
  </span>
);

class SpacyParserInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = { 
      sentenceValue: "",
      spacyModelValue: "en_core_web_sm",
      mergeNpValue: false
  };
    this.handleListChange = this.handleListChange.bind(this);
    this.handleSentenceChange = this.handleSentenceChange.bind(this);
    this.handleSpacyModelChange = this.handleSpacyModelChange.bind(this);
    this.handleMergeNpOption = this.handleMergeNpOption.bind(this);
  }

  handleListChange(e) {
    if (e.target.value !== "") {
      this.setState({
        spacyParserSentenceValue: demoSentences[e.target.value],
      });
    }
  }

  handleSpacyModelChange(e) {
      this.setState({
        spacyModelValue: spacyModels[e.target.value]
    })
  };

  handleMergeNpOption(e) {
    this.setState({
      mergeNpValue: !this.state.mergeNpValue,
  })
};

  handleSentenceChange(e) {
    this.setState({
      spacyParserSentenceValue: e.target.value,
    });
  }

  render() {
    const { spacyParserSentenceValue, spacyModelValue, mergeNpValue} = this.state;
    const { outputState, getAnnotations } = this.props;

    const modelInputs = {
      "sentenceValue": spacyParserSentenceValue,
      "spacyModel": spacyModelValue,
      "mergeNp": mergeNpValue
    };

    return (
      <div className="model__content">
        <ModelIntro title={title} description={description} />
        <div className="form__instructions"><span>Enter text or</span>
          <select disabled={outputState === "working"} onChange={this.handleListChange}>
            <option>Choose an example...</option>
            {demoSentences.map((sentence, index) => {
              return (
                <option value={index} key={index}>{sentence}</option>
              );
            })}
          </select>
        </div>

        <div className="form__instructions"><span> Choose Spacy model: </span>
          <select disabled={outputState === "working"} onChange={this.handleSpacyModelChange}>
            <option>English - Default</option>
            {spacyModels.map((sentence, index) => {
              return (
                <option value={index} key={index}>{sentence}</option>
              );
            })}
          </select>
        </div>
        <div className="form__instructions"><span>Merge Noun Phrases:</span>
          <input type="checkbox" onChange={this.handleMergeNpOption}></input>
        </div>

        <div className="form__field">
          <label htmlFor="#input--parser-sentence">Sentence or Document for Parsing</label>
          <textarea onChange={this.handleSentenceChange} value={spacyParserSentenceValue} id="input--parser-sentence" ref="spacyParserSentence" type="text" required="true" autoFocus="true" placeholder="E.g. &quot;John likes and Bill hates ice cream.&quot;" />
        </div>
        <div className="form__field form__field--btn">
          <Button enabled={outputState !== "working"} outputState={outputState} runModel={getAnnotations} inputs={modelInputs} />
        </div>
      </div>
    );
  }
}

/*******************************************************************************
  <HierplaneVisualisation /> Component
*******************************************************************************/

class HierplaneVisualization extends React.Component {
  constructor(...args) {
    super(...args);
    this.state = { selectedIdx: 0 };

    this.selectNextTree = this.selectNextTree.bind(this);
    this.selectPrevTree = this.selectPrevTree.bind(this);
  }
  selectPrevTree() {
    const nextIdx =
        this.state.selectedIdx === 0 ? this.props.trees.length - 1 : this.state.selectedIdx - 1;
    this.setState({ selectedIdx: nextIdx });
  }
  selectNextTree() {
    const nextIdx =
        this.state.selectedIdx === this.props.trees.length - 1 ? 0 : this.state.selectedIdx + 1;
    this.setState({ selectedIdx: nextIdx });
  }

  render() {
    if (this.props.trees) {
      const totalSentenceCount = this.props.trees.length;
      const selectedSentenceIdxLabel = this.state.selectedIdx + 1;

      return (
        <div className="hierplane__visualization">
          <div className="hierplane__visualization-verbs">
            <a className="hierplane__visualization-verbs__prev" onClick={this.selectPrevTree}>
              <svg width="12" height="12">
                <use xlinkHref="#icon__disclosure"></use>
              </svg>
            </a>
            <a onClick={this.selectNextTree}>
              <svg width="12" height="12">
                <use xlinkHref="#icon__disclosure"></use>
              </svg>
            </a>
            <span className="hierplane__visualization-verbs__label">
              Sentence {selectedSentenceIdxLabel} of {totalSentenceCount}
            </span>
          </div>
          <Tree tree={this.props.trees[this.state.selectedIdx]["tree"]} theme="light" />
        </div>
      )
    } else {
      return null;
    }
  }
}

/*******************************************************************************
  <SpacyParserComponent /> Component
*******************************************************************************/


class _SpacyComponent extends React.Component {
  constructor(props) {
    super(props);

    const { requestData, responseData } = props;

    this.state = {
      requestData: requestData,
      responseData: responseData,
      // valid values: "working", "empty", "received", "error",
      outputState: responseData ? "received" : "empty",
    };
    this.getAnnotations = this.getAnnotations.bind(this);
  }

  getAnnotations(event, inputs) {
    this.setState({outputState: "working"});

    var payload = {text: inputs.sentenceValue,
                   model: inputs.spacyModel,
                  };

    if (inputs.mergeNp === true) {
      payload.collapse_phrases = true
    }

    fetch(`${API_ROOT}/annotate`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json();
    }).then((json) => {
        const location = {
          state: { requestData: payload, responseData: json }
        }
        this.props.history.push(location);
    }).catch((error) => {
      this.setState({ outputState: "error" });
      console.error(error);
    });
  }

  render() {
    const { requestData, responseData } = this.props;
    const sentence = requestData && requestData.sentence;

    return (
      <div className="pane__horizontal model">
        <PaneTop>
          <SpacyParserInput getAnnotations={this.getAnnotations}
            outputState={this.state.outputState}
            sentence={sentence} />
        </PaneTop>
        <PaneBottom outputState={this.state.outputState}>
          <HierplaneVisualization trees={responseData ? responseData : null} />
        </PaneBottom>
      </div>
    );
  }
}

const SpacyComponent = withRouter(_SpacyComponent)

export default SpacyComponent;